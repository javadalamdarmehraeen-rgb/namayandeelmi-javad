import { db, dbRetry } from "@/db";
import { activityLogs, roles, users } from "@/db/schema";

import { SESSION_COOKIE, createToken, verifyPassword } from "@/lib/auth";
import { ensureSeed } from "@/lib/bootstrap";
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
export async function POST(req: Request) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const phone = normalizePhone(body.phone ?? "");
  const mode = body.mode === "admin" ? "admin" : "rep"; //     
  const remember = body.remember === true;
  const deviceOnline = body.simActive !== false;
  if (!username || !password) {
    return Response.json({ error: "      " }, { status: 400 });
  }
  let rows: (typeof users.$inferSelect)[] = [];
  try {
    rows = await dbRetry(() => db.select().from(users).where(eq(users.username, username)).limit(1), "login:user");
  } catch (err) {
    console.error("login db error", err);
    return Response.json(
      { error: "      .  DATABASE_URL   ." },
      { status: 500 },
    );
  }
  const user = rows[0];
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return Response.json({ error: "      " }, { status: 401 });
  }
  if (!user.active) return Response.json({ error: "   " }, { status: 403 });
  //       
  let baseRole: string = user.role;
  if (!["admin", "supervisor", "rep"].includes(user.role)) {
    try {
      const r = (await dbRetry(() => db.select().from(roles).where(eq(roles.key, user.role)).limit(1), "login:role"))[0]
;
      baseRole = r?.base ?? "rep";
    } catch {
      baseRole = "rep";
    }
  }
  const isManagerAccount = baseRole === "admin" || baseRole === "supervisor";
  if (mode === "admin" && !isManagerAccount) {
    return Response.json(
      { error: "     .    «  »  ." },
      { status: 403 },
    );
  }
  if (mode === "rep" && isManagerAccount) {
    return Response.json(
      { error: "   / .    « »  ." },
      { status: 403 },
    );
  }
  /* ============================================================
   *    —         :
   *    off    →   
   *    phone  →         
   *    device →          ()
   *    otp    → :      
   * ============================================================ */
  const simMode = isManagerAccount ? "off" : (user.simMode ?? "device");
  const deviceId = String(body.deviceId ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 80);
  if (simMode !== "off" && user.requirePhone) {
    if (!deviceOnline) {
      return Response.json(
        { error: "     .      .", simError: true },

        { status: 403 },
      );
    }
    if (!/^0\d{10}$/.test(phone)) {
      return Response.json(
        { error: "           ", simError: true },
        { status: 400 },
      );
    }
    const registered = normalizePhone(user.phone);
    if (registered && phone !== registered) {
      return Response.json(
        {
          error: `  :       «${registered.slice(0, 4)}***${registered.slice(-4)
}»   «${phone.slice(0, 4)}***${phone.slice(-4)}»  .`,
          simError: true,
          reason: "phone-mismatch",
        },
        { status: 403 },
      );
    }
    if (body.simActiveOnDevice === false) {
      return Response.json(
        { error: "       .", simError: true, reason: "no-sim" },
        { status: 403 },
      );
    }
  }
  if ((simMode === "device" || simMode === "otp") && !isManagerAccount) {
    if (!deviceId) {
      return Response.json(
        { error: "    .           .", simError: true },
        { status: 400 },
      );
    }
    if (user.deviceId && user.deviceId !== deviceId) {
      return Response.json(
        {
          error:
            "        .         « »   
          .",
          needOtp: true,
          simError: true,
          reason: "device-mismatch",
        },
        { status: 403 },
      );
    }
    if (!user.deviceId) {
      if (simMode === "otp") {
        return Response.json(
          {
            error: "             .",
            needOtp: true,
            reason: "first-device",
          },
          { status: 403 },
        );
      }
      //  device:      
      await db
        .update(users)
        .set({
          deviceId,
          deviceInfo: String(body.deviceInfo ?? "").slice(0, 200),
          deviceBoundAt: new Date(),
        })
        .where(eq(users.id, user.id));
      await db
        .insert(activityLogs)
        .values({
          userId: user.id,
          userName: user.fullName,
          action: "  ",
          detail: `${String(body.deviceInfo ?? "").slice(0, 120)} | ${phone}`,
        })
        .catch(() => undefined);
    }
  }
  const token = createToken(user.id);
  //        (   )    .
  //  «   »          .
  {

    const store = await cookies();
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : {}),
    });
  }
  await db.update(users).set({ lastSeenAt: new Date() }).where(eq(users.id, user.id));
  await db
    .insert(activityLogs)
    .values({ userId: user.id, userName: user.fullName, action: "  ", detail: phone || " " })
    .catch(() => undefined);
  return Response.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: baseRole,
      roleKey: user.role,
      roleLabel: baseRole === "admin" ? " " : baseRole === "supervisor" ? "" : " ",
      phone: user.phone,
      requirePhone: user.requirePhone,
      permissions: user.permissions,
    },
  });
}
