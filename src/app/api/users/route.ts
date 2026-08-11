import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { ALL_PERMISSION_KEYS } from "@/lib/defaults";
import { asc, eq } from "drizzle-orm";
export const dynamic = "force-dynamic";
async function adminGuard() {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.role === "admin" || user.permissions.includes("users")) return user;
  return null;
}
export async function GET() {
  const admin = await adminGuard();
  if (!admin) return Response.json({ error: " " }, { status: 401 });
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      phone: users.phone,
      role: users.role,
      active: users.active,
      permissions: users.permissions,
      passwordPlain: users.passwordPlain,
      requirePhone: users.requirePhone,
      deviceId: users.deviceId,
      deviceInfo: users.deviceInfo,
      deviceBoundAt: users.deviceBoundAt,
      simMode: users.simMode,
      lastSeenAt: users.lastSeenAt,
      createdAt: users.createdAt,

    })
    .from(users)
    .orderBy(asc(users.id));
  return Response.json({ rows });
}
export async function POST(req: Request) {
  const admin = await adminGuard();
  if (!admin) return Response.json({ error: " " }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const username = String(b.username ?? "").trim().toLowerCase();
  const password = String(b.password ?? "");
  const fullName = String(b.fullName ?? "").trim();
  if (!username || !password || !fullName) {
    return Response.json({ error: "       " }, { status: 400 });
  }
  const dup = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (dup.length) return Response.json({ error: "      " }, { status: 400 });
  const [row] = await db
    .insert(users)
    .values({
      username,
      passwordHash: hashPassword(password),
      passwordPlain: password,
      fullName,
      phone: String(b.phone ?? "").trim(),
      role: String(b.role ?? "rep").slice(0, 40),
      active: b.active !== false,
      requirePhone: b.requirePhone !== false,
      simMode: ["off", "phone", "device", "otp"].includes(b.simMode) ? b.simMode : "device",
      permissions: Array.isArray(b.permissions) && b.permissions.length ? b.permissions : ALL_PERMISSION_KEYS,
    })
    .returning();
  return Response.json({ row: { ...row, passwordHash: undefined } });
}
export async function PATCH(req: Request) {
  const admin = await adminGuard();
  if (!admin) return Response.json({ error: " " }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const id = Number(b.id);
  if (!Number.isFinite(id)) return Response.json({ error: " " }, { status: 400 });
  const patch: Record<string, unknown> = {};
  if (typeof b.fullName === "string" && b.fullName.trim()) patch.fullName = b.fullName.trim();
  if (typeof b.phone === "string") patch.phone = b.phone.trim();
  if (typeof b.username === "string" && b.username.trim()) patch.username = b.username.trim().toLowerCase();
  if (typeof b.role === "string" && b.role.trim()) patch.role = b.role.trim().slice(0, 40);
  if (typeof b.active === "boolean") patch.active = b.active;
  if (typeof b.requirePhone === "boolean") patch.requirePhone = b.requirePhone;
  if (typeof b.simMode === "string" && ["off", "phone", "device", "otp"].includes(b.simMode)) {
    patch.simMode = b.simMode;
  }
  //    (  )
  if (b.releaseDevice === true) {
    patch.deviceId = "";
    patch.deviceInfo = "";
    patch.deviceBoundAt = null;
  }
  if (Array.isArray(b.permissions)) patch.permissions = b.permissions;
  if (typeof b.password === "string" && b.password.length >= 4) {
    patch.passwordHash = hashPassword(b.password);
    patch.passwordPlain = b.password;
  }
  if (Object.keys(patch).length === 0) return Response.json({ error: "  " }, { status: 400 });
  await db.update(users).set(patch).where(eq(users.id, id));
  return Response.json({ ok: true });
}
export async function DELETE(req: Request) {
  const admin = await adminGuard();
  if (!admin) return Response.json({ error: " " }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isFinite(id)) return Response.json({ error: " " }, { status: 400 });
  if (id === admin.id) return Response.json({ error: "    " }, { status: 400 });
  await db.delete(users).where(eq(users.id, id));
  return Response.json({ ok: true });
}
