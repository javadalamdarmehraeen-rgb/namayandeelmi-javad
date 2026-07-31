import { db } from "@/db";
import { messageLogs, messengers } from "@/db/schema";
import { PRODUCTS } from "./constants";
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

export function formatOrderMessage(o: OrderLike) {
  const lines: string[] = [];
  lines.push("🧾 سفارش جدید داروخانه");
  lines.push(`تاریخ سفارش: ${toPersianDigits(o.dateShamsi)}`);
  lines.push(`نماینده علمی: ${o.repName}`);
  lines.push(`نام داروخانه: ${o.pharmacyName}`);
  lines.push(`مسئول سفارش: ${o.managerName}`);
  lines.push(`شماره همراه: ${toPersianDigits(o.managerPhone)}`);
  lines.push(`آدرس: ${o.address}`);
  if (o.lat && o.lng) {
    lines.push(`لوکیشن: https://www.google.com/maps?q=${o.lat},${o.lng}`);
  }
  lines.push("— اقلام سفارش —");
  for (const p of PRODUCTS) {
    const q = Number(o.items?.[p.key] || 0);
    const b = Number(o.items?.[p.bonusKey] || 0);
    if (q || b) lines.push(`${p.label}: ${toPersianDigits(q)}  | جایزه: ${toPersianDigits(b)}`);
  }
  lines.push(`نام پخش: ${o.distributor}`);
  lines.push(`نام ویزیتور: ${o.visitor}`);
  if (o.notes) lines.push(`توضیحات: ${o.notes}`);
  return lines.join("\n");
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const text = await res.text();
  return { ok: res.ok, detail: text.slice(0, 300) };
}

async function sendOne(
  m: { platform: string; target: string; token: string },
  text: string,
): Promise<{ ok: boolean; detail: string }> {
  try {
    if (m.platform === "bale") {
      return await postJson(`https://tapi.bale.ai/bot${m.token}/sendMessage`, {
        chat_id: m.target,
        text,
      });
    }
    if (m.platform === "eitaa") {
      return await postJson(`https://eitaayar.ir/api/${m.token}/sendMessage`, {
        chat_id: m.target,
        text,
      });
    }
    if (m.platform === "whatsapp") {
      const [phoneNumberId, accessToken] = m.token.split(":");
      if (!phoneNumberId || !accessToken) {
        return { ok: false, detail: "توکن واتساپ باید به صورت phoneNumberId:accessToken باشد" };
      }
      const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: m.target,
          type: "text",
          text: { body: text },
        }),
        cache: "no-store",
      });
      const detail = (await res.text()).slice(0, 300);
      return { ok: res.ok, detail };
    }
    return { ok: false, detail: "پیام‌رسان ناشناخته" };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : "خطای شبکه" };
  }
}

/** Sends the order to every enabled messenger target. Never throws. */
export async function dispatchOrder(order: OrderLike) {
  const text = formatOrderMessage(order);
  let targets: { platform: string; target: string; token: string }[] = [];
  try {
    targets = await db.select().from(messengers);
    targets = (targets as unknown as (typeof messengers.$inferSelect)[])
      .filter((m) => m.enabled && m.token && m.target)
      .map((m) => ({ platform: m.platform, target: m.target, token: m.token }));
  } catch {
    targets = [];
  }
  const results: string[] = [];
  for (const t of targets) {
    const r = await sendOne(t, text);
    results.push(`${t.platform}:${r.ok ? "ارسال شد" : "ناموفق"}`);
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
  }
  return results.join(" | ") || "پیام‌رسانی فعال تعریف نشده است";
}
