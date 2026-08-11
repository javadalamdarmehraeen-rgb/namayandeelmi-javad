import { db } from "@/db";
import { roles, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { ensureSeed } from "@/lib/bootstrap";
import { asc, eq } from "drizzle-orm";
export const dynamic = "force-dynamic";
async function guard(write = false) {
  const user = await getSessionUser();
  if (!user) return null;
  if (!write) return user;
  if (user.role === "admin" || user.permissions.includes("users")) return user;
  return null;
}
export async function GET() {
  await ensureSeed();
  const user = await guard(false);
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const rows = await db.select().from(roles).orderBy(asc(roles.id));
  return Response.json({ rows });
}
export async function POST(req: Request) {
  const user = await guard(true);
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const label = String(b.label ?? "").trim();
  if (!label) return Response.json({ error: "   " }, { status: 400 });
  const key =
    String(b.key ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "") || `role_${Date.now().toString(36)}`;
  const base = ["admin", "supervisor", "rep"].includes(b.base) ? b.base : "rep";
  const dup = await db.select().from(roles).where(eq(roles.key, key)).limit(1);
  if (dup.length) return Response.json({ error: "    " }, { status: 400 });
  const [row] = await db
    .insert(roles)
    .values({ key, label, base, permissions: Array.isArray(b.permissions) ? b.permissions : [] })
    .returning();
  return Response.json({ row });
}
export async function PATCH(req: Request) {

  const user = await guard(true);
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const id = Number(b.id);
  if (!Number.isFinite(id)) return Response.json({ error: " " }, { status: 400 });
  const patch: Record<string, unknown> = {};
  if (typeof b.label === "string" && b.label.trim()) patch.label = b.label.trim();
  if (typeof b.base === "string" && ["admin", "supervisor", "rep"].includes(b.base)) patch.base = b.base;
  if (Array.isArray(b.permissions)) patch.permissions = b.permissions;
  if (Object.keys(patch).length === 0) return Response.json({ error: "  " }, { status: 400 });
  await db.update(roles).set(patch).where(eq(roles.id, id));
  return Response.json({ ok: true });
}
export async function DELETE(req: Request) {
  const user = await guard(true);
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isFinite(id)) return Response.json({ error: " " }, { status: 400 });
  const rows = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  const r = rows[0];
  if (!r) return Response.json({ error: "  " }, { status: 404 });
  if (r.builtin) return Response.json({ error: "    " }, { status: 400 });
  const inUse = await db.select({ id: users.id }).from(users).where(eq(users.role, r.key)).limit(1);
  if (inUse.length) return Response.json({ error: "       " }, { status: 400 });
  await db.delete(roles).where(eq(roles.id, id));
  return Response.json({ ok: true });
}
