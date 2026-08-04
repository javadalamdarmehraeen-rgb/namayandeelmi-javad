import { db } from "@/db";
import { users } from "@/db/schema";
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
  return Response.json({ exists: true, kind: u.role === "rep" ? "rep" : "admin", requirePhone: u.requirePhone });
}
