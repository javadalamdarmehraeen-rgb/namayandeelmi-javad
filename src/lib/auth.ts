import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const SECRET = process.env.APP_SECRET || "sabt-etelaat-kol-default-secret-key";
export const SESSION_COOKIE = "sek_session";

export type SessionUser = {
  id: number;
  username: string;
  fullName: string;
  role: "admin" | "supervisor" | "rep";
  phone: string;
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
  const payload = Buffer.from(
    JSON.stringify({ id: userId, iat: Date.now() }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readToken(token: string | undefined): number | null {
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

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const id = readToken(store.get(SESSION_COOKIE)?.value);
  if (!id) return null;
  let rows: (typeof users.$inferSelect)[] = [];
  try {
    rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  } catch (err) {
    console.error("getSessionUser db error", err);
    return null;
  }
  const u = rows[0];
  if (!u || !u.active) return null;
  return {
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    role: u.role === "admin" ? "admin" : u.role === "supervisor" ? "supervisor" : "rep",
    phone: u.phone,
    permissions: Array.isArray(u.permissions) ? u.permissions : [],
  };
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export function unauthorized() {
  return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
}
