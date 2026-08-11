import { db } from "@/db";
import { roles, users } from "@/db/schema";
import { ensureSeed } from "@/lib/bootstrap";

import { eq } from "drizzle-orm";
export const dynamic = "force-dynamic";
/**                 */
export async function POST(req: Request) {
  await ensureSeed();
  const b = await req.json().catch(() => ({}));
  const username = String(b.username ?? "").trim().toLowerCase();
  if (!username) return Response.json({ exists: false });
  const rows = await db
    .select({
      role: users.role,
      requirePhone: users.requirePhone,
      phone: users.phone,
      deviceId: users.deviceId,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  const u = rows[0];
  if (!u) return Response.json({ exists: false });
  let base: string = u.role;
  if (!["admin", "supervisor", "rep"].includes(u.role)) {
    const r = (await db.select().from(roles).where(eq(roles.key, u.role)).limit(1))[0];
    base = r?.base ?? "rep";
  }
  const digits = String(u.phone ?? "").replace(/\D/g, "");
  //                
  const phoneMask = digits.length >= 8 ? `${digits.slice(0, 4)}***${digits.slice(-4)}` : "";
  return Response.json({
    exists: true,
    kind: base === "rep" ? "rep" : "admin",
    requirePhone: u.requirePhone,
    hasPhone: digits.length >= 10,
    phoneMask,
    deviceBound: Boolean(u.deviceId),
  });
}
