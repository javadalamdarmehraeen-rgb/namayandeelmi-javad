import { db } from "@/db";
import { messageLogs, messengers, settings } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { getProxy } from "@/lib/messaging";
import { getSmsConfig } from "@/lib/otp";
import { desc, eq } from "drizzle-orm";
export const dynamic = "force-dynamic";
async function adminGuard() {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.role === "admin" || user.permissions.includes("messengers")) return user;
  return null;
}
export async function GET() {
  const admin = await adminGuard();
  if (!admin) return Response.json({ error: " " }, { status: 401 });
  const rows = await db.select().from(messengers).orderBy(desc(messengers.id));
  const logs = await db.select().from(messageLogs).orderBy(desc(messageLogs.id)).limit(50);
  const proxy = await getProxy();
  const sms = await getSmsConfig();
  let autoSend = true;
  try {
    const st = await db.select().from(settings).where(eq(settings.key, "autoSendOrders")).limit(1);
    const v = st[0]?.value as { enabled?: boolean } | undefined;
    if (v && typeof v.enabled === "boolean") autoSend = v.enabled;
  } catch {
    /* ignore */
  }
  return Response.json({ rows, logs, proxy, sms, autoSend });
}
export async function POST(req: Request) {
  const admin = await adminGuard();
  if (!admin) return Response.json({ error: " " }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const platform = String(b.platform ?? "");
  if (!["telegram", "bale", "eitaa", "whatsapp"].includes(platform)) {
    return Response.json({ error: " " }, { status: 400 });
  }
  const [row] = await db
    .insert(messengers)
    .values({
      platform,
      label: String(b.label ?? "").trim().slice(0, 160),
      targetType: ["group", "channel", "phone"].includes(b.targetType) ? b.targetType : "phone",
      target: String(b.target ?? "").trim(),
      token: String(b.token ?? "").trim(),
      provider: String(b.provider ?? "").trim().slice(0, 30),
      apiUrl: String(b.apiUrl ?? "").trim(),
      enabled: b.enabled !== false,
    })
    .returning();
  return Response.json({ row });
}
export async function PATCH(req: Request) {
  const admin = await adminGuard();
  if (!admin) return Response.json({ error: " " }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const id = Number(b.id);
  if (!Number.isFinite(id)) return Response.json({ error: " " }, { status: 400 });
  const patch: Record<string, unknown> = {};
  if (typeof b.label === "string") patch.label = b.label.trim();
  if (typeof b.target === "string") patch.target = b.target.trim();
  if (typeof b.targetType === "string" && ["group", "channel", "phone"].includes(b.targetType)) {

    patch.targetType = b.targetType;
  }
  if (typeof b.token === "string") patch.token = b.token.trim();
  if (typeof b.provider === "string") patch.provider = b.provider.trim().slice(0, 30);
  if (typeof b.apiUrl === "string") patch.apiUrl = b.apiUrl.trim();
  if (typeof b.enabled === "boolean") patch.enabled = b.enabled;
  if (Object.keys(patch).length === 0) return Response.json({ error: "  " }, { status: 400 });
  await db.update(messengers).set(patch).where(eq(messengers.id, id));
  return Response.json({ ok: true });
}
export async function DELETE(req: Request) {
  const admin = await adminGuard();
  if (!admin) return Response.json({ error: " " }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isFinite(id)) return Response.json({ error: " " }, { status: 400 });
  await db.delete(messengers).where(eq(messengers.id, id));
  return Response.json({ ok: true });
}
