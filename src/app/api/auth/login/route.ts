import { db } from "@/db";
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
  const mode = body.mode === "admin" ? "admin" : "rep"; // تب انتخاب‌شده در صفحه ورود
  const remember = body.remember === true;
  const deviceOnline = body.simActive !== false;

  if (!username || !password) {
    return Response.json({ error: "نام کاربری و رمز عبور الزامی است" }, { status: 400 });
  }

  let rows: (typeof users.$inferSelect)[] = [];
  try {
    rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
  } catch (err) {
    console.error("login db error", err);
    return Response.json(
      { error: "❌ اتصال به پایگاه داده برقرار نشد. مقدار DATABASE_URL را بررسی کنید." },
      { status: 500 },
    );
  }

  const user = rows[0];
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return Response.json({ error: "نام کاربری یا رمز عبور اشتباه است" }, { status: 401 });
  }
  if (!user.active) return Response.json({ error: "حساب کاربری غیرفعال است" }, { status: 403 });

  // ✅ تفکیک کامل ورود مدیر و نماینده
  let baseRole: string = user.role;
  if (!["admin", "supervisor", "rep"].includes(user.role)) {
    try {
      const r = (await db.select().from(roles).where(eq(roles.key, user.role)).limit(1))[0];
      baseRole = r?.base ?? "rep";
    } catch {
      baseRole = "rep";
    }
  }
  const isManagerAccount = baseRole === "admin" || baseRole === "supervisor";
  if (mode === "admin" && !isManagerAccount) {
    return Response.json(
      { error: "⛔ این حساب کاربری نماینده است. لطفاً از تب «ورود نماینده علمی» وارد شوید." },
      { status: 403 },
    );
  }
  if (mode === "rep" && isManagerAccount) {
    return Response.json(
      { error: "⛔ این حساب مدیر/سرپرست است. لطفاً از تب «ورود مدیر» وارد شوید." },
      { status: 403 },
    );
  }

  /* ============================================================
   *  کنترل سیم‌کارت — چهار حالت که مدیر برای هر کاربر تعیین می‌کند:
   *    off    → بدون هیچ بررسی
   *    phone  → فقط شماره واردشده باید با شماره ثبت‌شده یکی باشد
   *    device → علاوه بر شماره، حساب به یک گوشی قفل می‌شود (پیش‌فرض)
   *    otp    → سخت‌گیرانه: اثبات حضور سیم‌کارت با کد پیامکی
   * ============================================================ */
  const simMode = isManagerAccount ? "off" : (user.simMode ?? "device");
  const deviceId = String(body.deviceId ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 80);

  if (simMode !== "off" && user.requirePhone) {
    if (!deviceOnline) {
      return Response.json(
        { error: "⚠️ دستگاه به شبکه متصل نیست. سیم‌کارت یا اینترنت را فعال کنید.", simError: true },
        { status: 403 },
      );
    }
    if (!/^0\d{10}$/.test(phone)) {
      return Response.json(
        { error: "⚠️ شماره همراه فعال روی این گوشی را ۱۱ رقمی وارد کنید", simError: true },
        { status: 400 },
      );
    }
    const registered = normalizePhone(user.phone);
    if (registered && phone !== registered) {
      return Response.json(
        {
          error: `⛔ مغایرت سیم‌کارت: شماره ثبت‌شده توسط مدیر برای شما «${registered.slice(0, 4)}***${registered.slice(-4)}» است، اما «${phone.slice(0, 4)}***${phone.slice(-4)}» وارد کردید.`,
          simError: true,
          reason: "phone-mismatch",
        },
        { status: 403 },
      );
    }
    if (body.simActiveOnDevice === false) {
      return Response.json(
        { error: "⚠️ سیم‌کارت فعالی روی این گوشی شناسایی نشد.", simError: true, reason: "no-sim" },
        { status: 403 },
      );
    }
  }

  if ((simMode === "device" || simMode === "otp") && !isManagerAccount) {
    if (!deviceId) {
      return Response.json(
        { error: "⚠️ شناسه دستگاه دریافت نشد. حافظه مرورگر را فعال کنید یا از حالت ناشناس خارج شوید.", simError: true },
        { status: 400 },
      );
    }
    if (user.deviceId && user.deviceId !== deviceId) {
      return Response.json(
        {
          error:
            "⛔ این حساب به گوشی دیگری قفل شده است. اگر سیم‌کارت شما داخل همین گوشی است، با «تایید پیامکی» ادامه دهید؛ در غیر این صورت از مدیر بخواهید گوشی را آزاد کند.",
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
            error: "🔐 برای اطمینان از حضور سیم‌کارت در همین گوشی، کد تایید پیامکی لازم است.",
            needOtp: true,
            reason: "first-device",
          },
          { status: 403 },
        );
      }
      // حالت device: اولین گوشی به‌صورت خودکار قفل می‌شود
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
          action: "قفل شدن گوشی",
          detail: `${String(body.deviceInfo ?? "").slice(0, 120)} | ${phone}`,
        })
        .catch(() => undefined);
    }
  }

  const token = createToken(user.id);
  if (remember) {
    const store = await cookies();
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  await db.update(users).set({ lastSeenAt: new Date() }).where(eq(users.id, user.id));
  await db
    .insert(activityLogs)
    .values({ userId: user.id, userName: user.fullName, action: "ورود به سامانه", detail: phone || "بدون شماره" })
    .catch(() => undefined);

  return Response.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: baseRole,
      roleKey: user.role,
      roleLabel: baseRole === "admin" ? "مدیر سیستم" : baseRole === "supervisor" ? "سرپرست" : "نماینده علمی",
      phone: user.phone,
      requirePhone: user.requirePhone,
      permissions: user.permissions,
    },
  });
}
