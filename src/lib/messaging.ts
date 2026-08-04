import { db } from "@/db";
import { messageLogs, messengers } from "@/db/schema";
import { bonusKeyOf } from "./defaults";
import { getProducts } from "./settings-server";
import { toPersianDigits } from "./jalali";

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
  const snippet = raw.replace(/\s+/g, " ").slice(0, 200);
  if (status === 401 || status === 403) return `توکن ${platform} نامعتبر یا منقضی است (${status})`;
  if (status === 404) return `توکن/آدرس ${platform} یافت نشد (۴۰۴) — توکن ربات را بررسی کنید`;
  if (status === 400) return `مقصد نامعتبر است: ${snippet}`;
  return `خطای ${status}: ${snippet}`;
}

async function withTimeout(url: string, init: RequestInit, ms = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, cache: "no-store" });
  } finally {
    clearTimeout(t);
  }
}

export async function sendOne(
  m: { platform: string; target: string; token: string },
  text: string,
): Promise<{ ok: boolean; detail: string }> {
  const token = m.token.trim();
  const target = m.target.trim();
  if (!token) return { ok: false, detail: "توکن وارد نشده است" };
  if (!target) return { ok: false, detail: "مقصد (شماره یا آیدی گروه) وارد نشده است" };

  try {
    if (m.platform === "bale") {
      // Bale bot API – identical shape to Telegram
      const res = await withTimeout(`https://tapi.bale.ai/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: target, text }),
      });
      const raw = await res.text();
      let ok = res.ok;
      try {
        ok = ok && JSON.parse(raw)?.ok !== false;
      } catch {
        /* keep */
      }
      return ok ? { ok: true, detail: "ارسال شد" } : { ok: false, detail: friendly("بله", res.status, raw) };
    }

    if (m.platform === "eitaa") {
      // eitaayar.ir gateway expects form-urlencoded
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
      return res.ok
        ? { ok: true, detail: "ارسال شد" }
        : { ok: false, detail: friendly("واتساپ", res.status, raw) };
    }

    return { ok: false, detail: "پیام‌رسان ناشناخته" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "خطای شبکه";
    return {
      ok: false,
      detail: msg.includes("abort")
        ? "پاسخی از سرور پیام‌رسان دریافت نشد (Timeout)"
        : `خطای شبکه: ${msg}. اگر سرور خارج از ایران است، دسترسی به بله/ایتا ممکن است مسدود باشد.`,
    };
  }
}

/** Sends the order to every enabled messenger target. Never throws. */
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

  const results = await Promise.all(
    enabled.map(async (t) => {
      const r = await sendOne({ platform: t.platform, target: t.target, token: t.token }, text);
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
      const label = t.platform === "bale" ? "بله" : t.platform === "eitaa" ? "ایتا" : "واتساپ";
      return `${label}: ${r.ok ? "✔ ارسال شد" : `✖ ${r.detail}`}`;
    }),
  );
  return results.join(" | ");
}
