import { createHmac, timingSafeEqual } from "crypto";
import { db, dbRetrySafe, pool } from "@/db";
import { syncLogs, syncState } from "@/db/schema";
import { fetchWithRetry } from "./retry";
import { LOCAL_ONLY_COLUMNS, SYNC_TABLES, configuredPeers, nodeName, selfUrl, syncSecret } from "./sync-config";
import { eq } from "drizzle-orm";
/* ============================================================
 *      
 *
 *      :
 *    ) PULL  →     pullCursor    
 *    ) PUSH  →     pushCursor    
 *
 *   : Last-Write-Wins   updated_at
 *   :   origin      
 * ============================================================ */

export type ChangeSet = Record<string, Record<string, unknown>[]>;
export type SyncReport = {
  peer: string;
  ok: boolean;
  pulled: number;
  pushed: number;
  conflicts: number;
  detail: string;
  durationMs: number;
};
const MAX_BODY_ROWS = 800;
/* ------------------------------------------------------------------ */
/*                                                */
/* ------------------------------------------------------------------ */
export function signSync(body: string, timestamp: number) {
  return createHmac("sha256", syncSecret()).update(`${timestamp}.${body}`).digest("base64url");
}
export function verifySync(body: string, timestamp: number, signature: string) {
  if (!syncSecret()) return false;
  if (!signature) return false;
  if (Math.abs(Date.now() - timestamp) > 10 * 60 * 1000) return false;
  const expected = signSync(body, timestamp);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
/* ------------------------------------------------------------------ */
/*                                                    */
/* ------------------------------------------------------------------ */
async function tableColumns(table: string): Promise<string[]> {
  const res = await pool.query(
    `select column_name from information_schema.columns where table_schema='public' and table_name=$1`,
    [table],
  );
  return res.rows.map((r) => String(r.column_name));
}
/**
 *       .
 *
 * :   origin         
 *     .        :
 *   )        (sek.sync = on)
 *   )  `updated_at < excluded.updated_at`     
 */
export async function collectChanges(since: Date | null, excludeOrigin?: string): Promise<ChangeSet> {
  void excludeOrigin;
  const out: ChangeSet = {};
  const sinceIso = since ? since.toISOString() : "1970-01-01T00:00:00Z";
  for (const t of SYNC_TABLES) {
    if (!t.defaultOn) continue;
    try {
      const cols = await tableColumns(t.name);
      if (!cols.includes("uid") || !cols.includes("updated_at")) continue;
      const res = await pool.query(
        `select * from ${t.name} where updated_at > $1 order by updated_at asc limit $2`,
        [sinceIso, t.batch],
      );
      if (res.rows.length) out[t.name] = res.rows as Record<string, unknown>[];
    } catch (err) {
      console.warn(`[sync]  ${t.name} :`, err instanceof Error ? err.message : err);
    }
  }
  return out;
}
/* ------------------------------------------------------------------ */
/*                                                  */
/* ------------------------------------------------------------------ */
/** UPSERT   uid   Last-Write-Wins */
export async function applyChanges(changes: ChangeSet, fromPeer: string) {
  let applied = 0;
  let skipped = 0;
  //     set_config      

  const client = await pool.connect();
  try {
    await client.query(`select set_config('sek.sync','on',false)`);
  } catch {
    /* ignore */
  }
  const perTable: Record<string, { applied: number; skipped: number }> = {};
  for (const [table, rows] of Object.entries(changes)) {
    const cfg = SYNC_TABLES.find((t) => t.name === table);
    if (!cfg || !Array.isArray(rows) || rows.length === 0) continue;
    let cols: string[] = [];
    try {
      cols = await tableColumns(table);
    } catch {
      continue;
    }
    if (!cols.includes("uid")) continue;
    perTable[table] = { applied: 0, skipped: 0 };
    for (const raw of rows.slice(0, MAX_BODY_ROWS)) {
      const row = { ...raw } as Record<string, unknown>;
      const uid = String(row.uid ?? "");
      if (!uid) {
        skipped++;
        perTable[table].skipped++;
        continue;
      }
      //        
      for (const k of Object.keys(row)) {
        if (!cols.includes(k) || LOCAL_ONLY_COLUMNS.has(k)) delete row[k];
      }
      if (!row.origin) row.origin = fromPeer;
      const keys = Object.keys(row);
      if (keys.length === 0) continue;
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const updates = keys
        .filter((k) => k !== "uid")
        .map((k) => `${k} = excluded.${k}`)
        .join(", ");
      try {
        //        .
        // set_config            .
        const q = `
          insert into ${table} (${keys.join(", ")}) values (${placeholders})
          on conflict (uid) do update set ${updates}
          where ${table}.updated_at < excluded.updated_at
        `;
        const res = await client.query(q, keys.map((k) => row[k]));
        if (res.rowCount && res.rowCount > 0) {
          applied++;
          perTable[table].applied++;
        } else {
          skipped++;
          perTable[table].skipped++;
        }
      } catch (err) {
        skipped++;
        perTable[table].skipped++;
        console.warn(`[sync]  ${table}/${uid} :`, err instanceof Error ? err.message.slice(0, 120) : err);
      }
    }
  }
  //             
  //        .
  try {
    await client.query(`select set_config('sek.sync','off',false)`);
  } catch {
    /* ignore */
  }
  client.release();
  for (const [table, st] of Object.entries(perTable)) {
    void dbRetrySafe(
      () =>
        db.insert(syncLogs).values({
          peer: fromPeer,
          direction: "pull",

          tableName: table,
          applied: st.applied,
          skipped: st.skipped,
          ok: true,
        }),
      undefined,
      "sync:log",
    );
  }
  return { applied, skipped, perTable };
}
/* ------------------------------------------------------------------ */
/*                                                         */
/* ------------------------------------------------------------------ */
async function callPeer(url: string, path: string, payload: unknown) {
  const body = JSON.stringify(payload);
  const ts = Date.now();
  const res = await fetchWithRetry(
    `${url.replace(/\/$/, "")}${path}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sync-node": nodeName(),
        "x-sync-timestamp": String(ts),
        "x-sync-signature": signSync(body, ts),
      },
      body,
    },
    { retries: 3, baseDelayMs: 1200, maxDelayMs: 10_000, timeoutMs: 45_000, label: "sync" },
  );
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 200) };
  }
  if (!res.ok) throw new Error(String(data.error ?? `HTTP ${res.status}`));
  return data;
}
/* ------------------------------------------------------------------ */
/*                                                          */
/* ------------------------------------------------------------------ */
export async function ensurePeers() {
  const peers = configuredPeers();
  for (const p of peers) {
    const existing = await dbRetrySafe(
      () => db.select().from(syncState).where(eq(syncState.peer, p.peer)).limit(1),
      [],
      "sync:peer",
    );
    if (existing.length === 0) {
      await dbRetrySafe(
        () => db.insert(syncState).values({ peer: p.peer, peerUrl: p.url }),
        undefined,
        "sync:addPeer",
      );
    } else if (existing[0].peerUrl !== p.url) {
      await dbRetrySafe(
        () => db.update(syncState).set({ peerUrl: p.url }).where(eq(syncState.id, existing[0].id)),
        undefined,
        "sync:updPeer",
      );
    }
  }
  return dbRetrySafe(() => db.select().from(syncState), [], "sync:list");
}
/* ------------------------------------------------------------------ */
/*                                              */
/* ------------------------------------------------------------------ */
export async function syncWithPeer(peerRow: typeof syncState.$inferSelect): Promise<SyncReport> {
  const started = Date.now();
  const me = nodeName();
  let pulled = 0;
  let pushed = 0;
  let conflicts = 0;
  const notes: string[] = [];

  try {
    if (!syncSecret()) throw new Error("SYNC_SECRET   ");
    if (!peerRow.peerUrl) throw new Error("    ");
    /* ---------- ) PULL:    ---------- */
    const pullRes = await callPeer(peerRow.peerUrl, "/api/sync/pull", {
      node: me,
      since: peerRow.pullCursor ? new Date(peerRow.pullCursor).toISOString() : null,
      excludeOrigin: me, //     
    });
    const changes = (pullRes.changes ?? {}) as ChangeSet;
    const applyRes = await applyChanges(changes, peerRow.peer);
    pulled = applyRes.applied;
    conflicts += applyRes.skipped;
    const newPullCursor = pullRes.cursor ? new Date(String(pullRes.cursor)) : new Date();
    notes.push(` ${pulled} `);
    /* ---------- ) PUSH:    ---------- */
    const localChanges = await collectChanges(
      peerRow.pushCursor ? new Date(peerRow.pushCursor) : null,
      peerRow.peer, //       
    );
    const rowCount = Object.values(localChanges).reduce((a, r) => a + r.length, 0);
    let newPushCursor = peerRow.pushCursor ? new Date(peerRow.pushCursor) : new Date(0);
    if (rowCount > 0) {
      const pushRes = await callPeer(peerRow.peerUrl, "/api/sync/push", { node: me, changes: localChanges });
      pushed = Number(pushRes.applied ?? 0);
      conflicts += Number(pushRes.skipped ?? 0);
      //  updated_at   
      for (const rows of Object.values(localChanges)) {
        for (const r of rows) {
          const u = new Date(String(r.updated_at));
          if (!Number.isNaN(u.getTime()) && u > newPushCursor) newPushCursor = u;
        }
      }
      notes.push(` ${pushed} `);
    } else {
      newPushCursor = new Date();
      notes.push("   ");
    }
    await dbRetrySafe(
      () =>
        db
          .update(syncState)
          .set({
            pullCursor: newPullCursor,
            pushCursor: newPushCursor,
            lastSyncAt: new Date(),
            lastStatus: ` ${notes.join(" | ")}`,
            lastError: "",
            pulled: (peerRow.pulled ?? 0) + pulled,
            pushed: (peerRow.pushed ?? 0) + pushed,
            conflicts: (peerRow.conflicts ?? 0) + conflicts,
          })
          .where(eq(syncState.id, peerRow.id)),
      undefined,
      "sync:ok",
    );
    return {
      peer: peerRow.peer,
      ok: true,
      pulled,
      pushed,
      conflicts,
      detail: notes.join(" | "),
      durationMs: Date.now() - started,
    };
  } catch (err) {
    const detail = err instanceof Error ? err.message : " ";
    await dbRetrySafe(
      () =>
        db
          .update(syncState)
          .set({ lastSyncAt: new Date(), lastStatus: " ", lastError: detail.slice(0, 400) })
          .where(eq(syncState.id, peerRow.id)),
      undefined,
      "sync:fail",
    );
    await dbRetrySafe(

      () => db.insert(syncLogs).values({ peer: peerRow.peer, direction: "both", ok: false, detail: detail.slice(0, 400) 
}),
      undefined,
      "sync:logFail",
    );
    return {
      peer: peerRow.peer,
      ok: false,
      pulled,
      pushed,
      conflicts,
      detail,
      durationMs: Date.now() - started,
    };
  }
}
/**      */
export async function syncAll(): Promise<SyncReport[]> {
  const peers = await ensurePeers();
  const active = peers.filter((p) => p.enabled && p.peerUrl);
  if (active.length === 0) return [];
  const out: SyncReport[] = [];
  for (const p of active) out.push(await syncWithPeer(p));
  return out;
}
export function syncInfo() {
  return {
    node: nodeName(),
    url: selfUrl(),
    peers: configuredPeers(),
    hasSecret: Boolean(syncSecret()),
    tables: SYNC_TABLES.filter((t) => t.defaultOn).map((t) => t.name),
  };
}
