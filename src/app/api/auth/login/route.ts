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
  const deviceSim = body.simActive !== false;

  if (!username || !password) {
    return Response.json({ error: "نام کاربری و رمز عبور الزامی است" }, { status: 400 });
  }

  let rows: (typeof users.$inferSelect)[] = [];
  try {
    rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
  } catch (err) {
    console.error("login db error", err);
    return Response.json(
      {
        error:
          "❌ اتصال به پایگاه داده برقرار نشد. مقدار DATABASE_URL (رشته اتصال Neon همراه با ?sslmode=require) را در تنظیمات سرویس بررسی کنید.",
      },
      { status: 500 },
    );
  }
  const user = rows[0];
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return Response.json({ error: "نام کاربری یا رمز عبور اشتباه است" }, { status: 401 });
  }
  if (!user.active) {
    return Response.json({ error: "حساب کاربری غیرفعال است" }, { status: 403 });
  }
  if (!deviceSim) {
    return Response.json(
      { error: "⚠️ سیم‌کارت فعالی روی این گوشی شناسایی نشد. لطفاً سیم‌کارت ثبت‌شده را فعال کنید." },
      { status: 403 },
    );
  }
  const registered = normalizePhone(user.phone);
  if (registered && phone !== registered) {
    return Response.json(
      {
        error:
          "⚠️ شماره همراه وارد شده با شماره ثبت‌شده برای این کاربر مطابقت ندارد. شماره‌ای را وارد کنید که روی همین گوشی فعال است.",
      },
      { status: 403 },
    );
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, createToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  await db.update(users).set({ lastSeenAt: new Date() }).where(eq(users.id, user.id));
  await db.insert(activityLogs).values({
    userId: user.id,
    userName: user.fullName,
    action: "ورود به سامانه",
    detail: phone,
  });

  return Response.json({
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      permissions: user.permissions,
    },
  });
}
