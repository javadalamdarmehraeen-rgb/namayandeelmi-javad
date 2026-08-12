import { issueNonce } from "@/lib/mobile-auth";
import { ensureSeed } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";
/**
 *  nonce    .
 *        nonce        .
 *
 * POST /api/mobile/nonce   { deviceId }
 *  → { nonce, expiresAt, ttlMs, serverTime }
 */
export async function POST(req: Request) {
  void ensureSeed();
  const b = await req.json().catch(() => ({}));
  const deviceId = String(b.deviceId ?? "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  if (!deviceId) {
    return Response.json({ error: "   " }, { status: 400 });
  }
  const { nonce, expiresAt, ttlMs } = await issueNonce(deviceId);
  return Response.json(
    { nonce, expiresAt: expiresAt.toISOString(), ttlMs, serverTime: Date.now() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
