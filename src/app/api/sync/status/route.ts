import { db, dbRetrySafe } from "@/db";
import { syncLogs, syncState } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { ensureSeed } from "@/lib/bootstrap";
import { ensurePeers, syncInfo } from "@/lib/sync";
import { desc } from "drizzle-orm";
export const dynamic = "force-dynamic";
export async function GET() {
  await ensureSeed();
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && !user.permissions.includes("users"))) {
    return Response.json({ error: " " }, { status: 401 });
  }
  const peers = await ensurePeers();
  const logs = await dbRetrySafe(
    () => db.select().from(syncLogs).orderBy(desc(syncLogs.id)).limit(40),
    [],
    "sync:logs",
  );
  return Response.json({ info: syncInfo(), peers, logs }, { headers: { "Cache-Control": "no-store" } });
}
/** /      */
export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return Response.json({ error: " " }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const id = Number(b.id);
  if (!Number.isFinite(id)) return Response.json({ error: " " }, { status: 400 });
  const patch: Record<string, unknown> = {};
  if (typeof b.enabled === "boolean") patch.enabled = b.enabled;
  if (typeof b.peerUrl === "string") patch.peerUrl = b.peerUrl.trim();
  if (b.resetCursor === true) {
    patch.pullCursor = null;
    patch.pushCursor = null;
  }
  if (Object.keys(patch).length === 0) return Response.json({ error: "  " }, { status: 400 });
  const { eq } = await import("drizzle-orm");
  await db.update(syncState).set(patch).where(eq(syncState.id, id));
  return Response.json({ ok: true });
}
/**      */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return Response.json({ error: " " }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const peer = String(b.peer ?? "").trim().slice(0, 80);
  const peerUrl = String(b.peerUrl ?? "").trim();
  if (!peer || !peerUrl.startsWith("http")) {
    return Response.json({ error: "     " }, { status: 400 });
  }
  await db.insert(syncState).values({ peer, peerUrl }).onConflictDoNothing();
  return Response.json({ ok: true });
}
