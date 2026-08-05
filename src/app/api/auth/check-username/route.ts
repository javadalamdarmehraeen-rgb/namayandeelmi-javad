import { db } from "@/db";
import { roles, users } from "@/db/schema";
import { ensureSeed } from "@/lib/bootstrap";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** بررسی می‌کند نام کاربری در کدام تب باید وارد شود و آیا شماره همراه لازم است */
export async function POST(req: Request) {
  await ensureSeed();
  const b = await req.json().catch(() => ({}));
  const username = String(b.username ?? "").trim().toLowerCase();
  if (!username) return Response.json({ exists: false });
  const rows = await db
    .select({ role: users.role, requirePhone: users.requirePhone })
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
  return Response.json({ exists: true, kind: base === "rep" ? "rep" : "admin", requirePhone: u.requirePhone });
}
