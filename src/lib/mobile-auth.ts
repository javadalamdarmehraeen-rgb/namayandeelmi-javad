import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { db, dbRetrySafe } from "@/db";
import { mobileNonces } from "@/db/schema";
import { and, eq, gt, lt } from "drizzle-orm";
/* ============================================================
 *       
 *
 *    :
 *   )  HMAC-SHA256       
 *   ) nonce     ( Replay Attack)
 *   )      
 * ============================================================ */
/**     —  Render  MOBILE_APP_SECRET   */
const APP_SECRET = process.env.MOBILE_APP_SECRET || process.env.APP_SECRET || "sek-mobile-shared-secret";
export const NONCE_TTL_MS = 3 * 60 * 1000; //  
export const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000; //    
/**  nonce       */
export async function issueNonce(deviceId: string) {
  const nonce = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + NONCE_TTL_MS);
  await dbRetrySafe(
    () => db.insert(mobileNonces).values({ nonce, deviceId: deviceId.slice(0, 80), expiresAt }),
    undefined,
    "nonce:issue",
  );
  //  nonce  (  )
  void dbRetrySafe(
    () => db.delete(mobileNonces).where(lt(mobileNonces.expiresAt, new Date(Date.now() - NONCE_TTL_MS))),
    undefined,
    "nonce:cleanup",
  );
  return { nonce, expiresAt, ttlMs: NONCE_TTL_MS };
}
/**  nonce —      */
export async function consumeNonce(nonce: string): Promise<boolean> {
  if (!nonce) return false;
  const rows = await dbRetrySafe(
    () =>
      db
        .select()
        .from(mobileNonces)
        .where(and(eq(mobileNonces.nonce, nonce), eq(mobileNonces.used, false), gt(mobileNonces.expiresAt, new Date())))
        .limit(1),
    [],
    "nonce:consume",
  );
  if (rows.length === 0) return false;
  await dbRetrySafe(
    () => db.update(mobileNonces).set({ used: true }).where(eq(mobileNonces.id, rows[0].id)),

    undefined,
    "nonce:mark",
  );
  return true;
}
/**             */
export function canonicalPayload(input: {
  nonce: string;
  timestamp: number;
  deviceId: string;
  phoneNumber?: string;
  simFingerprint?: string;
}) {
  return [
    input.nonce,
    String(input.timestamp),
    input.deviceId,
    input.phoneNumber ?? "",
    input.simFingerprint ?? "",
  ].join("|");
}
export function signPayload(canonical: string) {
  return createHmac("sha256", APP_SECRET).update(canonical).digest("base64url");
}
export function verifySignature(canonical: string, signature: string) {
  if (!signature) return false;
  const expected = signPayload(canonical);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
/**        (ICCID/IMSI)     */
export function hashSim(value: string) {
  if (!value) return "";
  return createHash("sha256").update(`${value}|${APP_SECRET}`).digest("hex").slice(0, 64);
}
export function normalizePhone(p: string) {
  return String(p ?? "")
    .replace(/[\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, "")
    .replace(/^0098/, "0")
    .replace(/^98/, "0")
    .replace(/^(?!0)(9\d{9})$/, "0$1");
}
export function maskPhone(p: string) {
  const d = normalizePhone(p);
  return d.length >= 8 ? `${d.slice(0, 4)}***${d.slice(-4)}` : "";
}
export type AttestationResult =
  | { ok: true }
  | { ok: false; status: number; error: string; code: string };
/**
 *     :  + nonce +  .
 *      MOBILE_ALLOW_UNSIGNED=1   .
 */
export async function verifyAttestation(body: {
  nonce?: string;
  timestamp?: number;
  signature?: string;
  deviceId?: string;
  phoneNumber?: string;
  simFingerprint?: string;
}): Promise<AttestationResult> {
  const allowUnsigned = process.env.MOBILE_ALLOW_UNSIGNED === "1";
  const nonce = String(body.nonce ?? "");
  const timestamp = Number(body.timestamp ?? 0);
  const deviceId = String(body.deviceId ?? "");
  if (!deviceId) {
    return { ok: false, status: 400, error: "    ", code: "NO_DEVICE_ID" };
  }
  if (allowUnsigned) return { ok: true };
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > MAX_CLOCK_SKEW_MS) {

    return {
      ok: false,
      status: 401,
      error: "      .     .",
      code: "CLOCK_SKEW",
    };
  }
  const canonical = canonicalPayload({
    nonce,
    timestamp,
    deviceId,
    phoneNumber: body.phoneNumber,
    simFingerprint: body.simFingerprint,
  });
  if (!verifySignature(canonical, String(body.signature ?? ""))) {
    return { ok: false, status: 401, error: "   ", code: "BAD_SIGNATURE" };
  }
  if (!(await consumeNonce(nonce))) {
    return {
      ok: false,
      status: 401,
      error: "     .   .",
      code: "BAD_NONCE",
    };
  }
  return { ok: true };
}
