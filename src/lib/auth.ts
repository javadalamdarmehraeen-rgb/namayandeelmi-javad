import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { db, dbRetry } from "@/db";
import { roles, users } from "@/db/schema";
import { eq } from "drizzle-orm";
const SECRET = process.env.APP_SECRET || "sabt-etelaat-kol-default-secret-key";
export const SESSION_COOKIE = "sek_session";
export const AUTH_HEADER = "x-auth-token";
export type SessionUser = {
  id: number;
  username: string;
  fullName: string;
  /**      */
  role: "admin" | "supervisor" | "rep";
  /**    (     sales) */
  roleKey: string;
  roleLabel: string;
  phone: string;
  requirePhone: boolean;
  permissions: string[];
};
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}
export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 32);
  const original = Buffer.from(hash, "hex");
  if (candidate.length !== original.length) return false;
  return timingSafeEqual(candidate, original);
}
function sign(payload: string) {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}
export function createToken(userId: number) {
  const payload = Buffer.from(JSON.stringify({ id: userId, iat: Date.now() })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
export function readToken(token: string | undefined | null): number | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (sign(payload) !== signature) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof data.id === "number" ? data.id : null;
  } catch {
    return null;
  }
}
export async function userFromId(id: number): Promise<SessionUser | null> {
  let rows: (typeof users.$inferSelect)[] = [];
  try {
    rows = await dbRetry(() => db.select().from(users).where(eq(users.id, id)).limit(1), "session:user");
  } catch (err) {
    console.error("session db error", err);
    return null;
  }
  const u = rows[0];
  if (!u || !u.active) return null;
  //            roles  
  let base: "admin" | "supervisor" | "rep" =
    u.role === "admin" ? "admin" : u.role === "supervisor" ? "supervisor" : "rep";
  let roleLabel = base === "admin" ? " " : base === "supervisor" ? "" : " ";
  if (!["admin", "supervisor", "rep"].includes(u.role)) {
    try {
      const r = (await dbRetry(() => db.select().from(roles).where(eq(roles.key, u.role)).limit(1), "session:role"))[0];
      if (r) {

        base = r.base === "admin" ? "admin" : r.base === "supervisor" ? "supervisor" : "rep";
        roleLabel = r.label;
      }
    } catch {
      /* ignore */
    }
  }
  return {
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    role: base,
    roleKey: u.role,
    roleLabel,
    phone: u.phone,
    requirePhone: u.requirePhone,
    permissions: Array.isArray(u.permissions) ? u.permissions : [],
  };
}
/**
 *     `x-auth-token`   (    )
 *       ( «   »).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const h = await headers();
  const headerId = readToken(h.get(AUTH_HEADER));
  if (headerId) return userFromId(headerId);
  const store = await cookies();
  const cookieId = readToken(store.get(SESSION_COOKIE)?.value);
  if (!cookieId) return null;
  return userFromId(cookieId);
}
export function can(user: SessionUser | null, perm: string) {
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.permissions.includes(perm);
}
export function unauthorized() {
  return Response.json({ error: " " }, { status: 401 });
}
