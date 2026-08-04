import { db } from "@/db";
import { messageLogs, messengers, settings } from "@/db/schema";
import { bonusKeyOf } from "./defaults";
import { getProducts } from "./settings-server";
import { toPersianDigits } from "./jalali";
import { eq } from "drizzle-orm";

type OrderLike = {
  id: number;
  repName: string;
  dateShamsi: string;
  pharmacyName: string;
  managerName: string;
  managerPhone: string;
  address: string;
  lat: number | null;
  lng: number | null;
  items: Record<string, number>;
  distributor: string;
  visitor: string;
  notes: string;
};

export type ProxyConfig = { url: string; enabled: boolean; secret?: string };

export const DEFAULT_PROXY: ProxyConfig = {
  url: "https://namayandeelmi-javad.javadalamdar-mehraeen.workers.dev/",
  enabled: true,
  secret: "",
};

export type TokenMap = Record<string, string>;

const FALLBACK_TOKENS: TokenMap = {
  bale: process.env.BALE_BOT_TOKEN || "1199464939:uhHpJVtcy__qdtFfN7iuzr4AH7bZBKPG85A",
  telegram: process.env.TELEGRAM_BOT_TOKEN || "",
  eitaa: process.env.EITAA_TOKEN || "",
  whatsapp: process.env.WHATSAPP_TOKEN || "",
};

/** توکن‌های پیش‌فرض سامانه؛ اگر برای یک مقصد توکن وارد نشده باشد از اینها استفاده می‌شود. */
export async function getTokens(): Promise<TokenMap> {
  try {
    const rows = await db.select().from(settings).where(eq(settings.key, "messengerTokens")).limit(1);
    const v = rows[0]?.value as TokenMap | undefined;
    if (v && typeof v === "object") return { ...FALLBACK_TOKENS, ...v };
  } catch {
    /* ignore */
  }
  return FALLBACK_TOKENS;
}

export async function resolveToken(platform: string, rowToken?: string) {
  const t = (rowToken ?? "").trim();
  if (t) return t;
  const map = await getTokens();
  return (map[platform] ?? "").trim();
}

/** استخراج chat_id های اخیر ربات (بله/تلگرام) برای انتخاب آسان مقصد */
export async function fetchUpdates(platform: string, rowToken?: string) {
  const token = await resolveToken(platform, rowToken);
  if (!token) return { ok: false, detail: "توکن ربات موجود نیست", chats: [] as ChatInfo[] };
  const bases =
    platform === "telegram"
      ? ["https://api.telegram.org"]
      : platform === "bale"
        ? ["https://tapi.bale.ai", "https://api.bale.ai"]
        : [];
  if (bases.length === 0) return { ok: false, detail: "این پیام‌رسان پشتیبانی نمی‌شود", chats: [] as ChatInfo[] };

  const proxy = await getProxy();
  const chats = new Map<string, ChatInfo>();
  let lastErr = "";

  const consume = (raw: string) => {
    try {
      const j = JSON.parse(raw);
      const list = j?.result ?? [];
      for (const u of list) {
        const c = u?.message?.chat ?? u?.channel_post?.chat ?? u?.edited_message?.chat;
        if (!c?.id) continue;
        const id = String(c.id);
        chats.set(id, {
          id,
          title: c.title || [c.first_name, c.last_name].filter(Boolean).join(" ") || c.username || id,
          type: c.type === "private" ? "شخصی" : c.type === "group" || c.type === "supergroup" ? "گروه" : "کانال",
        });
      }
      return j?.ok !== false;
    } catch {
      return false;
    }
  };

  for (const base of bases) {
    try {
      const res = await withTimeout(`${base}/bot${token}/getUpdates?limit=100`, { method: "GET" }, 15000);
      const raw = await res.text();
      if (res.ok && consume(raw)) return { ok: true, detail: "", chats: [...chats.values()] };
      lastErr = raw.slice(0, 200);
    } catch (err) {
      lastErr = err instanceof Error ? err.message : "خطای شبکه";
    }
  }

  // تلاش از طریق پروکسی (وقتی سرور به بله/تلگرام دسترسی ندارد)
  if (proxy.enabled && proxy.url) {
    try {
      const res = await withTimeout(proxy.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(proxy.secret ? { "x-proxy-secret": proxy.secret } : {}),
        },
        body: JSON.stringify({ action: "getUpdates", messenger: platform === "eitaa" ? "ita" : platform, token }),
      });
      const raw = await res.text();
      if (res.ok && consume(raw)) return { ok: true, detail: "از طریق پروکسی", chats: [...chats.values()] };
      lastErr = raw.slice(0, 200);
    } catch (err) {
      lastErr = err instanceof Error ? err.message : lastErr;
    }
  }

  return {
    ok: false,
    detail: `دریافت لیست چت ناموفق بود: ${lastErr}. ابتدا در ربات پیامی بفرستید یا ربات را در گروه عضو کنید.`,
    chats: [] as ChatInfo[],
  };
}

export type ChatInfo = { id: string; title: string; type: string };

export async function getProxy(): Promise<ProxyConfig> {
  try {
    const rows = await db.select().from(settings).where(eq(settings.key, "messagingProxy")).limit(1);
    const v = rows[0]?.value as ProxyConfig | undefined;
    if (v && typeof v.url === "string") return { ...DEFAULT_PROXY, ...v };
  } catch {
    /* ignore */
  }
  return DEFAULT_PROXY;
}

export async function formatOrderMessage(o: OrderLike) {
  const PRODUCTS = await getProducts();
  const lines: string[] = [];
  lines.push("🧾 سفارش جدید داروخانه");
  lines.push(`تاریخ سفارش: ${toPersianDigits(o.dateShamsi)}`);
  lines.push(`نماینده علمی: ${o.repName}`);
  lines.push(`نام داروخانه: ${o.pharmacyName}`);
  lines.push(`مسئول سفارش: ${o.managerName}`);
  lines.push(`شماره همراه: ${toPersianDigits(o.managerPhone)}`);
  lines.push(`آدرس: ${o.address}`);
  if (o.lat && o.lng) lines.push(`لوکیشن: https://www.google.com/maps?q=${o.lat},${o.lng}`);
  lines.push("— اقلام سفارش —");
  for (const p of PRODUCTS) {
    const q = Number(o.items?.[p.key] || 0);
    const b = Number(o.items?.[bonusKeyOf(p.key)] || 0);
    if (q || b) lines.push(`${p.label}: ${toPersianDigits(q)} | جایزه: ${toPersianDigits(b)}`);
  }
  lines.push(`نام پخش: ${o.distributor}`);
  lines.push(`نام ویزیتور: ${o.visitor}`);
  if (o.notes) lines.push(`توضیحات: ${o.notes}`);
  return lines.join("\n");
}

function friendly(platform: string, status: number, raw: string) {
  const snippet = raw.replace(/\s+/g, " ").slice(0, 220);
  if (status === 401 || status === 403) return `توکن ${platform} نامعتبر یا منقضی است (${status}) — ${snippet}`;
  if (status === 404) return `آدرس/توکن ${platform} یافت نشد (۴۰۴) — ${snippet}`;
  if (status === 400) return `مقصد یا پارامتر نامعتبر: ${snippet}`;
  return `خطای ${status}: ${snippet}`;
}

async function withTimeout(url: string, init: RequestInit, ms = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, cache: "no-store" });
  } finally {
    clearTimeout(t);
  }
}

const LABEL: Record<string, string> = {
  telegram: "تلگرام",
  bale: "بله",
  eitaa: "ایتا",
  whatsapp: "واتساپ",
};

/** ارسال از طریق پروکسی Cloudflare Worker (برای عبور از تحریم/فیلترینگ سرورهای خارجی) */
async function sendViaProxy(
  proxy: ProxyConfig,
  m: { platform: string; target: string; token: string },
  text: string,
): Promise<{ ok: boolean; detail: string }> {
  const url = proxy.url.trim();
  if (!url) return { ok: false, detail: "آدرس پروکسی تنظیم نشده است" };
  // نگاشت نام‌ها برای سازگاری با ورکرهای رایج
  const alias = m.platform === "eitaa" ? "ita" : m.platform;
  try {
    const res = await withTimeout(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(proxy.secret ? { "x-proxy-secret": proxy.secret } : {}),
      },
      body: JSON.stringify({
        messenger: alias,
        platform: m.platform,
        text,
        chatId: m.target,
        chat_id: m.target,
        token: m.token,
      }),
    });
    const raw = await res.text();
    let ok = res.ok;
    let detail = raw.slice(0, 220);
    try {
      const j = JSON.parse(raw);
      if (j.success === false || j.ok === false) {
        ok = false;
        detail = String(j.error ?? j.description ?? detail);
      } else if (j.success === true || j.ok === true) {
        ok = true;
        detail = "ارسال شد (از طریق پروکسی)";
      }
    } catch {
      /* raw text */
    }
    return ok
      ? { ok: true, detail }
      : { ok: false, detail: `پروکسی: ${friendly(LABEL[m.platform] ?? m.platform, res.status, detail)}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "خطای شبکه";
    return {
      ok: false,
      detail: msg.includes("abort") ? "پاسخی از پروکسی دریافت نشد (Timeout)" : `خطای پروکسی: ${msg}`,
    };
  }
}

/** ارسال مستقیم (بدون پروکسی) */
async function sendDirect(
  m: { platform: string; target: string; token: string },
  text: string,
): Promise<{ ok: boolean; detail: string }> {
  const token = m.token.trim();
  const target = m.target.trim();
  try {
    if (m.platform === "telegram" || m.platform === "bale") {
      const base =
        m.platform === "telegram" ? `https://api.telegram.org/bot${token}` : `https://tapi.bale.ai/bot${token}`;
      const res = await withTimeout(`${base}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: target, text }),
      });
      const raw = await res.text();
      let ok = res.ok;
      let detail = "ارسال شد";
      try {
        const j = JSON.parse(raw);
        if (j.ok === false) {
          ok = false;
          detail = String(j.description ?? raw);
        }
      } catch {
        detail = raw.slice(0, 200);
      }
      return ok ? { ok, detail } : { ok: false, detail: friendly(LABEL[m.platform], res.status, detail) };
    }

    if (m.platform === "eitaa") {
      const body = new URLSearchParams({ chat_id: target, text });
      const res = await withTimeout(`https://eitaayar.ir/api/${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      const raw = await res.text();
      let ok = res.ok;
      try {
        ok = ok && JSON.parse(raw)?.ok !== false;
      } catch {
        /* keep */
      }
      return ok ? { ok: true, detail: "ارسال شد" } : { ok: false, detail: friendly("ایتا", res.status, raw) };
    }

    if (m.platform === "whatsapp") {
      const idx = token.indexOf(":");
      const phoneNumberId = idx > 0 ? token.slice(0, idx) : "";
      const accessToken = idx > 0 ? token.slice(idx + 1) : "";
      if (!phoneNumberId || !accessToken) {
        return { ok: false, detail: "قالب توکن واتساپ باید phoneNumberId:accessToken باشد" };
      }
      const res = await withTimeout(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: target.replace(/\D/g, ""),
          type: "text",
          text: { preview_url: false, body: text },
        }),
      });
      const raw = await res.text();
      return res.ok ? { ok: true, detail: "ارسال شد" } : { ok: false, detail: friendly("واتساپ", res.status, raw) };
    }

    return { ok: false, detail: "پیام‌رسان ناشناخته" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "خطای شبکه";
    return {
      ok: false,
      detail: msg.includes("abort")
        ? "پاسخی از سرور پیام‌رسان دریافت نشد (Timeout) — پروکسی را فعال کنید"
        : `خطای شبکه: ${msg} — سرور خارج از ایران معمولاً به این سرویس دسترسی ندارد؛ پروکسی را فعال کنید.`,
    };
  }
}

export async function sendOne(
  input: { platform: string; target: string; token: string },
  text: string,
  proxyOverride?: ProxyConfig,
): Promise<{ ok: boolean; detail: string }> {
  if (!input.target.trim()) return { ok: false, detail: "مقصد (chat_id یا شماره) وارد نشده است" };
  // اگر توکن مقصد خالی باشد، از توکن پیش‌فرض سامانه استفاده می‌شود
  const m = { ...input, token: await resolveToken(input.platform, input.token) };
  const proxy = proxyOverride ?? (await getProxy());
  if (proxy.enabled && proxy.url) {
    // ابتدا تلاش مستقیم (سریع‌تر و دقیق‌تر)، سپس پروکسی
    if (m.token.trim()) {
      const direct = await sendDirect(m, text);
      if (direct.ok) return direct;
      const viaProxyAfter = await sendViaProxy(proxy, m, text);
      return viaProxyAfter.ok
        ? viaProxyAfter
        : { ok: false, detail: `مستقیم: ${direct.detail} | پروکسی: ${viaProxyAfter.detail}` };
    }
    const viaProxy = await sendViaProxy(proxy, m, text);
    if (viaProxy.ok) return viaProxy;
    if (!m.token.trim()) return viaProxy;
    const direct = await sendDirect(m, text);
    return direct.ok ? { ok: true, detail: `${direct.detail} (مستقیم)` } : { ok: false, detail: `${viaProxy.detail} | مستقیم: ${direct.detail}` };
  }
  if (!m.token.trim()) return { ok: false, detail: "توکن وارد نشده است (یا پروکسی را فعال کنید)" };
  return sendDirect(m, text);
}

/** ارسال سفارش به همه مقصدهای فعال. هرگز خطا پرتاب نمی‌کند. */
export async function dispatchOrder(order: OrderLike) {
  const text = await formatOrderMessage(order);
  let targets: (typeof messengers.$inferSelect)[] = [];
  try {
    targets = await db.select().from(messengers);
  } catch {
    targets = [];
  }
  const enabled = targets.filter((m) => m.enabled);
  if (enabled.length === 0) return "پیام‌رسان فعالی تعریف نشده است";
  const proxy = await getProxy();

  const results = await Promise.all(
    enabled.map(async (t) => {
      const r = await sendOne({ platform: t.platform, target: t.target, token: t.token }, text, proxy);
      try {
        await db.insert(messageLogs).values({
          orderId: order.id,
          platform: t.platform,
          target: t.target,
          ok: r.ok,
          detail: r.detail,
        });
      } catch {
        /* ignore */
      }
      return `${LABEL[t.platform] ?? t.platform}: ${r.ok ? "✔ ارسال شد" : `✖ ${r.detail}`}`;
    }),
  );
  return results.join(" | ");
}
