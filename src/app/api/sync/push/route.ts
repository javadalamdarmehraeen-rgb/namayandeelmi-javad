import { applyChanges, verifySync, type ChangeSet } from "@/lib/sync";
import { ensureSeed } from "@/lib/bootstrap";
import { nodeName } from "@/lib/sync-config";
export const dynamic = "force-dynamic";
/**
 *       .
 * POST /api/sync/push  { node, changes }  (  HMAC)
 */
export async function POST(req: Request) {
  await ensureSeed();
  const raw = await req.text();
  const ts = Number(req.headers.get("x-sync-timestamp") ?? 0);
  const sig = req.headers.get("x-sync-signature") ?? "";
  if (!verifySync(raw, ts, sig)) {
    return Response.json({ error: "   " }, { status: 401 });
  }
  let body: { node?: string; changes?: ChangeSet } = {};
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: " " }, { status: 400 });
  }
  const from = String(body.node ?? req.headers.get("x-sync-node") ?? "peer");
  const res = await applyChanges(body.changes ?? {}, from);
  return Response.json(
    { node: nodeName(), applied: res.applied, skipped: res.skipped, tables: res.perTable },
    { headers: { "Cache-Control": "no-store" } },
  );
}
