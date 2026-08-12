import { db } from "@/db";
import {
  activityLogs,
  attachments,
  doctors,
  homes,
  leaves,
  messageLogs,
  messengers,
  notifications,
  options,
  orders,
  pharmacies,
  roles,
  settings,
  tripPoints,
  trips,
  users,
} from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { ensureSeed } from "@/lib/bootstrap";
import { sql } from "drizzle-orm";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
type Row = Record<string, unknown>;
/**            Date   */
function clean(rows: unknown, dateFields: string[] = []): Row[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => {
    const o = { ...(r as Row) };
    for (const f of dateFields) {
      if (o[f]) o[f] = new Date(String(o[f]));
      else if (o[f] === null) o[f] = null;
    }
    return o;
  });
}
async function resetSeq(table: string) {
  try {
    await db.execute(
      sql.raw(
        `SELECT setval(pg_get_serial_sequence('${table}','id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), true)`,
      ),
    );
  } catch {
    /* ignore */
  }
}
export async function POST(req: Request) {
  await ensureSeed();
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return Response.json({ error: " " }, { status: 401 });
  const body = await req.json().catch(() => null);
  const payload = body?.data ? body : body?.backup;
  const data = (payload?.data ?? {}) as Record<string, unknown>;
  if (!data || typeof data !== "object" || !Array.isArray(data.users)) {
    return Response.json({ error: "   " }, { status: 400 });

  }
  const mode = body?.mode === "merge" ? "merge" : "replace";
  const report: Record<string, number> = {};
  try {
    if (mode === "replace") {
      //         
      for (const t of [
        "attachments",
        "trip_points",
        "trips",
        "orders",
        "doctors",
        "pharmacies",
        "homes",
        "leaves",
        "notifications",
        "message_logs",
        "messengers",
        "activity_logs",
        "options",
        "settings",
        "roles",
        "users",
      ]) {
        await db.execute(sql.raw(`DELETE FROM ${t}`));
      }
    }
    const put = async (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      table: any,
      key: string,
      tableName: string,
      dates: string[] = [],
    ) => {
      const rows = clean(data[key], dates);
      if (!rows.length) return;
      for (let i = 0; i < rows.length; i += 200) {
        const chunk = rows.slice(i, i + 200);
        await db.insert(table).values(chunk).onConflictDoNothing();
      }
      report[key] = rows.length;
      await resetSeq(tableName);
    };
    await put(users, "users", "users", ["createdAt", "lastSeenAt", "deviceBoundAt"]);
    await put(roles, "roles", "roles", ["createdAt"]);
    await put(settings, "settings", "settings", ["updatedAt"]);
    await put(options, "options", "options", ["createdAt"]);
    await put(pharmacies, "pharmacies", "pharmacies", ["createdAt"]);
    await put(doctors, "doctors", "doctors", ["createdAt"]);
    await put(orders, "orders", "orders", ["createdAt"]);
    await put(homes, "homes", "homes", ["updatedAt"]);
    await put(leaves, "leaves", "leaves", ["createdAt"]);
    await put(trips, "trips", "trips", ["startedAt", "endedAt"]);
    await put(tripPoints, "tripPoints", "trip_points", ["recordedAt"]);
    await put(messengers, "messengers", "messengers", ["createdAt"]);
    await put(messageLogs, "messageLogs", "message_logs", ["createdAt"]);
    await put(notifications, "notifications", "notifications", ["createdAt", "readAt"]);
    await put(activityLogs, "activityLogs", "activity_logs", ["createdAt"]);
    //     base64   
    const atts = clean(data.attachments, ["createdAt"]).filter((a) => typeof a.data === "string" && a.data);
    if (atts.length) {
      for (let i = 0; i < atts.length; i += 50) {
        await db
          .insert(attachments)
          .values(atts.slice(i, i + 50) as (typeof attachments.$inferInsert)[])
          .onConflictDoNothing();
      }
      report.attachments = atts.length;
      await resetSeq("attachments");
    }
    await db
      .insert(activityLogs)
      .values({
        userId: user.id,
        userName: user.fullName,
        action: " ",
        detail: `: ${mode === "replace" ? " " : ""} | ${JSON.stringify(report)}`.slice(0, 400),
      })
      .catch(() => undefined);

    return Response.json({ ok: true, mode, report });
  } catch (err) {
    console.error("restore error", err);
    return Response.json(
      { error: `  : ${err instanceof Error ? err.message : ""}` },
      { status: 500 },
    );
  }
}
