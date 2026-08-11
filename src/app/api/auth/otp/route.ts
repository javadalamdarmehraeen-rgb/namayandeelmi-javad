import { db } from "@/db";
import { activityLogs, users } from "@/db/schema";
import { SESSION_COOKIE, createToken, verifyPassword } from "@/lib/auth";
import { ensureSeed } from "@/lib/bootstrap";
import { getSmsConfig, issueOtp, verifyOtp } from "@/lib/otp";
import { notify } from "@/lib/notify";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
export const dynamic = "force-dynamic";
function normalizePhone(p: string) {
  return String(p ?? "")
    .replace(/[\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, "")
    .replace(/^0098/, "0")
    .replace(/^98/, "0");
}
/**
 *     :
 *  action=request →       
 *  action=verify  →        
 */
export async function POST(req: Request) {
  await ensureSeed();
  const b = await req.json().catch(() => ({}));

  const action = String(b.action ?? "request");
  const username = String(b.username ?? "").trim().toLowerCase();
  const password = String(b.password ?? "");
  const deviceId = String(b.deviceId ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 80);
  const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
  const user = rows[0];
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return Response.json({ error: "      " }, { status: 401 });
  }
  if (!user.active) return Response.json({ error: "   " }, { status: 403 });
  const registered = normalizePhone(user.phone);
  if (!registered) {
    return Response.json(
      { error: "       .    ." },
      { status: 400 },
    );
  }
  if (action === "request") {
    const r = await issueOtp(user.id, registered, deviceId);
    const cfg = await getSmsConfig();
    if (!r.sent) {
      // /    →         
      await notify({
        toRole: "admin",
        fromName: user.fullName,
        kind: "otp",
        title: `     ${user.fullName}`,
        body: `: ${r.code}\n: ${registered}\n:  \n      .`,
        link: "/admin/users",
      });
    }
    return Response.json({
      ok: true,
      sent: r.sent,
      channel: r.channel,
      masked: `${registered.slice(0, 4)}***${registered.slice(-4)}`,
      message: r.sent
        ? `    ${registered.slice(0, 4)}***${registered.slice(-4)}  .      
     .`
        : cfg.enabled
          ? `   (${r.detail}).        .`
          : "     .          .",
    });
  }
  if (action === "verify") {
    const v = await verifyOtp(user.id, registered, String(b.code ?? ""));
    if (!v.ok) return Response.json({ error: v.error }, { status: 400 });
    //      
    await db
      .update(users)
      .set({
        deviceId,
        deviceInfo: String(b.deviceInfo ?? "").slice(0, 200),
        deviceBoundAt: new Date(),
        lastSeenAt: new Date(),
      })
      .where(eq(users.id, user.id));
    await db
      .insert(activityLogs)
      .values({
        userId: user.id,
        userName: user.fullName,
        action: " ",
        detail: `${registered} | ${String(b.deviceInfo ?? "").slice(0, 100)}`,
      })
      .catch(() => undefined);
    const token = createToken(user.id);
    {
      const store = await cookies();
      store.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        ...(b.remember !== false ? { maxAge: 60 * 60 * 24 * 30 } : {}),
      });

    }
    return Response.json({
      ok: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        roleKey: user.role,
        phone: user.phone,
        requirePhone: user.requirePhone,
        permissions: user.permissions,
      },
    });
  }
  return Response.json({ error: " " }, { status: 400 });
}
