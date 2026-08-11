import { collectChanges, verifySync } from "@/lib/sync";
import { ensureSeed } from "@/lib/bootstrap";
import { nodeName } from "@/lib/sync-config";
export const dynamic = "force-dynamic";
/**
 *     .
 * POST /api/sync/pull  { since, excludeOrigin }  (  HMAC)
 */
export async function POST(req: Request) {
  await ensureSeed();
  const raw = await req.text();
  const ts = Number(req.headers.get("x-sync-timestamp") ?? 0);
  const sig = req.headers.get("x-sync-signature") ?? "";
  if (!verifySync(raw, ts, sig)) {
    return Response.json({ error: "   " }, { status: 401 });
  }
  let body: { since?: string | null; excludeOrigin?: string } = {};
  try {
    body = JSON.parse(raw);
  } catch {
    /* ignore */
  }
  const since = body.since ? new Date(body.since) : null;
  const changes = await collectChanges(Number.isNaN(since?.getTime()) ? null : since, body.excludeOrigin);
  const count = Object.values(changes).reduce((a, r) => a + r.length, 0);
  return Response.json(
    { node: nodeName(), cursor: new Date().toISOString(), count, changes },
    { headers: { "Cache-Control": "no-store" } },

  );
}
