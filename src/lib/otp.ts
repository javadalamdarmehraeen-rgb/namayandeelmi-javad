import { createHash, randomInt } from "crypto";
import { db } from "@/db";
import { messengers, otpCodes, settings } from "@/db/schema";
import { and, desc, eq, gt } from "drizzle-orm";
import { sendOne } from "./messaging";

export const OTP_TTL_MS = 3 * 60 * 1000; // ۳ دقیقه
export const OTP_MAX_ATTEMPTS = 5;

export function hashCode(code: string, phone: string) {
  const secret = process.env.APP_SECRET || "sabt-etelaat-kol-default-secret-key";
  return createHash("sha256").update(`${code}|${phone}|${secret}`).digest("hex");
}

export function generateCode() {
  return String(randomInt(10000, 100000)); // ۵ رقمی
}

type SmsConfig = { provider: string; apiKey: string; sender: string; pattern: string; enabled: boolean };

export const DEFAULT_SMS: SmsConfig = {
  provider: "kavenegar",
  apiKey: "",
  sender: "",
  pattern: "",
  enabled: false,
};

export async function getSmsConfig(): Promise<SmsConfig> {
  try {
    const rows = await db.select().from(settings).where(eq(settings.key, "sms")).limit(1);
    const v = rows[0]?.value as Partial<SmsConfig> | undefined;
    if (v) return { ...DEFAULT_SMS, ...v };
  } catch {
    /* ignore */
  }
  return {
    ...DEFAULT_SMS,
    provider: process.env.SMS_PROVIDER || DEFAULT_SMS.provider,
    apiKey: process.env.SMS_API_KEY || "",
    sender: process.env.SMS_SENDER || "",
    pattern: process.env.SMS_PATTERN || "",
    enabled: Boolean(process.env.SMS_API_KEY),
  };
}

async function post(url: string, init?: RequestInit, ms = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, cache: "no-store" });
  } finally {
    clearTimeout(t);
  }
}

/** ارسال پیامک از طریق سرویس‌دهنده‌های رایج ایرانی */
async function sendSms(phone: string, code: string): Promise<{ ok: boolean; detail: string }> {
  const cfg = await getSmsConfig();
  if (!cfg.enabled || !cfg.apiKey) return { ok: false, detail: "سرویس پیامک تنظیم نشده است" };
  const text = `کد تایید ورود شما به «ثبت اطلاعات کل»: ${code}\nاعتبار: ۳ دقیقه`;

  try {
    if (cfg.provider === "kavenegar") {
      const base = `https://api.kavenegar.com/v1/${cfg.apiKey}`;
      const url = cfg.pattern
        ? `${base}/verify/lookup.json?receptor=${phone}&token=${code}&template=${cfg.pattern}`
        : `${base}/sms/send.json?receptor=${phone}&sender=${cfg.sender}&message=${encodeURIComponent(text)}`;
      const r = await post(url, { method: "GET" });
      const raw = (await r.text()).slice(0, 200);
      return r.ok ? { ok: true, detail: "ارسال شد" } : { ok: false, detail: raw };
    }
    if (cfg.provider === "smsir") {
      const r = await post("https://api.sms.ir/v1/send/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": cfg.apiKey },
        body: JSON.stringify({
          mobile: phone,
          templateId: Number(cfg.pattern) || 100000,
          parameters: [{ name: "CODE", value: code }],
        }),
      });
      const raw = (await r.text()).slice(0, 200);
      return r.ok ? { ok: true, detail: "ارسال شد" } : { ok: false, detail: raw };
    }
    if (cfg.provider === "melipayamak") {
      const r = await post("https://console.melipayamak.com/api/send/simple/" + cfg.apiKey, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: cfg.sender, to: phone, text }),
      });
      const raw = (await r.text()).slice(0, 200);
      return r.ok ? { ok: true, detail: "ارسال شد" } : { ok: false, detail: raw };
    }
    // ارائه‌دهنده سفارشی: آدرس با جایگزین‌های {phone} و {code}
    if (cfg.provider === "custom" && cfg.sender) {
      const url = cfg.sender.replace("{phone}", phone).replace("{code}", code);
      const r = await post(url, { method: "GET" });
      return r.ok ? { ok: true, detail: "ارسال شد" } : { ok: false, detail: `کد ${r.status}` };
    }
    return { ok: false, detail: "ارائه‌دهنده پیامک پشتیبانی نمی‌شود" };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : "خطای شبکه" };
  }
}

/** ارسال کد از طریق پیام‌رسان (بله/تلگرام) به مقصد ثبت‌شده همان شماره */
async function sendViaMessenger(phone: string, code: string): Promise<{ ok: boolean; detail: string }> {
  try {
    const rows = await db.select().from(messengers);
    const target = rows.find((m) => m.enabled && m.target.replace(/\D/g, "").endsWith(phone.slice(-9)));
    if (!target) return { ok: false, detail: "مقصد پیام‌رسان برای این شماره ثبت نشده است" };
    const r = await sendOne(
      { platform: target.platform, target: target.target, token: target.token },
      `کد تایید ورود شما به «ثبت اطلاعات کل»: ${code}\nاعتبار: ۳ دقیقه`,
    );
    return r;
  } catch {
    return { ok: false, detail: "ارسال از طریق پیام‌رسان ناموفق بود" };
  }
}

export async function issueOtp(userId: number, phone: string, deviceId: string) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  let channel = "sms";
  let res = await sendSms(phone, code);
  if (!res.ok) {
    const alt = await sendViaMessenger(phone, code);
    if (alt.ok) {
      channel = "messenger";
      res = alt;
    }
  }

  await db.insert(otpCodes).values({
    userId,
    phone,
    codeHash: hashCode(code, phone),
    deviceId,
    channel: res.ok ? channel : "manual",
    expiresAt,
  });

  return { sent: res.ok, channel: res.ok ? channel : "manual", detail: res.detail, code };
}

export async function verifyOtp(userId: number, phone: string, code: string) {
  const rows = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.userId, userId), eq(otpCodes.used, false), gt(otpCodes.expiresAt, new Date())))
    .orderBy(desc(otpCodes.id))
    .limit(1);
  const row = rows[0];
  if (!row) return { ok: false, error: "کد منقضی شده است. دوباره درخواست کنید." };
  if (row.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, error: "تعداد تلاش بیش از حد. کد جدید بگیرید." };

  if (row.codeHash !== hashCode(String(code).trim(), phone)) {
    await db.update(otpCodes).set({ attempts: row.attempts + 1 }).where(eq(otpCodes.id, row.id));
    return { ok: false, error: `کد وارد شده صحیح نیست (${OTP_MAX_ATTEMPTS - row.attempts - 1} تلاش باقی مانده)` };
  }
  await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, row.id));
  return { ok: true, deviceId: row.deviceId };
}
