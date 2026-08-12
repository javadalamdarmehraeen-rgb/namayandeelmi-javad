import { db, dbRetry } from "@/db";
import { activityLogs, roles, users } from "@/db/schema";
import { SESSION_COOKIE, createToken } from "@/lib/auth";
import { ensureSeed } from "@/lib/bootstrap";
import { hashSim, maskPhone, normalizePhone, verifyAttestation } from "@/lib/mobile-auth";
import { issueOtp } from "@/lib/otp";
import { notify } from "@/lib/notify";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
export const dynamic = "force-dynamic";
/**
 *        .
 *
 * POST /api/mobile/login-with-phone
 * {
 *   deviceId, deviceInfo, nonce, timestamp, signature,
 *   phoneNumber?,        //        
 *   simFingerprint?,     // ICCID/IMSI  carrier+mcc/mnc ( )
 *   simCarrier?, simCount?, simState?
 * }
 *
 * :
 *   200 { token, user }                →  
 *   403 { needOtp: true, ... }         →     (     )
 *   401/403/404 { error, code }        →  
 */
export async function POST(req: Request) {
  await ensureSeed();
  const b = await req.json().catch(() => ({}));
  /* ---------- )    ---------- */
  const att = await verifyAttestation(b);
  if (!att.ok) return Response.json({ error: att.error, code: att.code }, { status: att.status });
  const deviceId = String(b.deviceId ?? "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  const deviceInfo = String(b.deviceInfo ?? "").slice(0, 200);
  const phone = normalizePhone(b.phoneNumber ?? "");
  const simFp = hashSim(String(b.simFingerprint ?? ""));
  const simCarrier = String(b.simCarrier ?? "").slice(0, 80);

  /* ---------- )   →    ---------- */
  if (!phone || !/^0\d{10}$/.test(phone)) {
    return Response.json(
      {
        error:
          "      (        ).    
  .",
        code: "SIM_NUMBER_UNAVAILABLE",
        needOtp: true,
        simCarrier,
      },
      { status: 422 },
    );
  }
  /* ---------- )      ---------- */
  const rows = await dbRetry(() => db.select().from(users).where(eq(users.phone, phone)).limit(1), "mobile:findUser");
  let found: typeof users.$inferSelect | undefined = rows[0];
  if (!found) {
    //  :       
    const all = await dbRetry(() => db.select().from(users), "mobile:allUsers");
    found = all.find((u) => normalizePhone(u.phone) === phone);
  }
  if (!found) {
    return Response.json(
      { error: "       .    .", code: "PHONE_NOT_REGISTERED" },
      { status: 404 },
    );
  }
  const user = found;
  if (!user.active) {
    return Response.json({ error: "   ", code: "USER_INACTIVE" }, { status: 403 });
  }
  /* ---------- )   ---------- */
  let baseRole: string = user.role;
  if (!["admin", "supervisor", "rep"].includes(user.role)) {
    const r = (await dbRetry(() => db.select().from(roles).where(eq(roles.key, user.role)).limit(1), "mobile:role"))[0];
    baseRole = r?.base ?? "rep";
  }
  const isManager = baseRole === "admin" || baseRole === "supervisor";
  /* ---------- )         ---------- */
  const isPhoneVerificationRequired = user.requirePhone && !isManager;
  const simMode = isManager ? "off" : (user.simMode ?? "device");
  if (!isPhoneVerificationRequired || simMode === "off") {
    return Response.json(
      {
        error: "            .",
        code: "PASSWORD_LOGIN_REQUIRED",
        loginUrl: "/login",
      },
      { status: 403 },
    );
  }
  /* ---------- )   ---------- */
  if (user.deviceId && user.deviceId !== deviceId) {
    return Response.json(
      {
        error:
          "       .                
   .",
        code: "DEVICE_MISMATCH",
        needOtp: true,
      },
      { status: 403 },
    );
  }
  /* ---------- )       ---------- */
  if (user.simFingerprint && simFp && user.simFingerprint !== simFp) {
    return Response.json(
      {
        error: "     .      .",
        code: "SIM_CHANGED",
        needOtp: true,
      },
      { status: 403 },
    );
  }

  /* ---------- )  :    ---------- */
  if (simMode === "otp" && !user.deviceId) {
    const r = await issueOtp(user.id, phone, deviceId);
    if (!r.sent) {
      await notify({
        toRole: "admin",
        fromName: user.fullName,
        kind: "otp",
        title: `     ${user.fullName}`,
        body: `: ${r.code}\n: ${phone}\n:  `,
        link: "/admin/users",
      });
    }
    return Response.json(
      {
        error: "          .",
        code: "OTP_REQUIRED",
        needOtp: true,
        masked: maskPhone(phone),
        sent: r.sent,
      },
      { status: 403 },
    );
  }
  /* ---------- )  :   +    ---------- */
  await dbRetry(
    () =>
      db
        .update(users)
        .set({
          deviceId,
          deviceInfo,
          deviceBoundAt: user.deviceBoundAt ?? new Date(),
          simFingerprint: simFp || user.simFingerprint,
          simCarrier: simCarrier || user.simCarrier,
          simVerifiedAt: new Date(),
          lastSeenAt: new Date(),
        })
        .where(eq(users.id, user.id)),
    "mobile:bind",
  );
  await db
    .insert(activityLogs)
    .values({
      userId: user.id,
      userName: user.fullName,
      action: "   ",
      detail: `${maskPhone(phone)} | ${simCarrier || " "} | ${deviceInfo}`,
    })
    .catch(() => undefined);
  const token = createToken(user.id);
  if (b.remember !== false) {
    const store = await cookies();
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return Response.json({
    ok: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: baseRole,
      roleKey: user.role,
      phone: user.phone,
      requirePhone: user.requirePhone,
      permissions: user.permissions,
    },
  });
}
