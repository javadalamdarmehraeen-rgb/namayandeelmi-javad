import { db } from "@/db";
import { activityLogs, users } from "@/db/schema";
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
  const isManagerAccount = user.role === "admin" || user.role === "supervisor";
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

  // ✅ الزام شماره همراه به تفکیک هر کاربر
  if (user.requirePhone) {
    if (!deviceOnline) {
      return Response.json(
        { error: "⚠️ سیم‌کارت/شبکه فعالی روی این دستگاه شناسایی نشد." },
        { status: 403 },
      );
    }
    if (!/^0\d{10}$/.test(phone)) {
      return Response.json({ error: "⚠️ شماره همراه فعال روی این گوشی را وارد کنید" }, { status: 400 });
    }
    const registered = normalizePhone(user.phone);
    if (registered && phone !== registered) {
      return Response.json(
        { error: "⚠️ شماره همراه وارد شده با شماره ثبت‌شده برای این کاربر مطابقت ندارد." },
        { status: 403 },
      );
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
      role: user.role,
      permissions: user.permissions,
    },
  });
}
