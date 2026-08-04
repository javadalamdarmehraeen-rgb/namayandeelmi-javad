/**
 * ============================================================
 *  پروکسی ارسال پیام برای سامانه «ثبت اطلاعات کل»
 *  Cloudflare Worker — نسخه کامل (تلگرام، بله، ایتا، واتساپ)
 * ------------------------------------------------------------
 *  مزیت این نسخه نسبت به نسخه ساده:
 *   ۱) توکن و chat_id را از خود برنامه می‌گیرد → دیگر لازم نیست
 *      برای هر ربات، ورکر را دوباره ویرایش و منتشر کنید.
 *   ۲) اگر توکن ارسال نشود، از مقادیر پیش‌فرض پایین استفاده می‌کند.
 *   ۳) پشتیبانی از واتساپ (WhatsApp Cloud API).
 *   ۴) پاسخ یکنواخت JSON + CORS + رمز اختیاری (x-proxy-secret).
 *   ۵) برای بله چند دامنه را امتحان می‌کند (tapi و api).
 * ============================================================
 */

const CONFIG = {
  // در صورت تمایل می‌توانید مقادیر پیش‌فرض را اینجا بگذارید (اختیاری)
  TELEGRAM_BOT_TOKEN: "",
  TELEGRAM_CHAT_ID: "",
  BALE_BOT_TOKEN: "",
  BALE_CHAT_ID: "",
  ITA_BOT_TOKEN: "",
  ITA_CHAT_ID: "",
  WHATSAPP_TOKEN: "", // به صورت phoneNumberId:accessToken
  WHATSAPP_TO: "",
  // اگر مقدار بدهید، فقط درخواست‌هایی با هدر x-proxy-secret برابر همین مقدار پذیرفته می‌شوند
  PROXY_SECRET: "",
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-proxy-secret",
};

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (request.method === "GET") {
      return json({ ok: true, service: "sabt-etelaat-kol proxy", messengers: ["telegram", "bale", "ita", "whatsapp"] });
    }
    if (request.method !== "POST") return json({ success: false, error: "فقط POST مجاز است" }, 405);

    if (CONFIG.PROXY_SECRET && request.headers.get("x-proxy-secret") !== CONFIG.PROXY_SECRET) {
      return json({ success: false, error: "رمز پروکسی نادرست است" }, 401);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ success: false, error: "بدنه درخواست باید JSON باشد" }, 400);
    }

    const messenger = String(body.messenger || body.platform || "").toLowerCase();
    const text = body.text;
    const chatId = body.chatId || body.chat_id;
    const token = body.token;

    if (!messenger) return json({ success: false, error: 'فیلد "messenger" الزامی است' }, 400);
    if (!text) return json({ success: false, error: 'فیلد "text" الزامی است' }, 400);

    try {
      let result;
      switch (messenger) {
        case "telegram":
          result = await sendTelegram(text, chatId, token);
          break;
        case "bale":
          result = await sendBale(text, chatId, token);
          break;
        case "ita":
        case "eitaa":
          result = await sendEitaa(text, chatId, token);
          break;
        case "whatsapp":
          result = await sendWhatsapp(text, chatId, token);
          break;
        default:
          return json({ success: false, error: "پیام‌رسان پشتیبانی نمی‌شود" }, 400);
      }
      return json({ success: true, ok: true, messenger, data: result });
    } catch (error) {
      return json({ success: false, ok: false, messenger, error: String(error.message || error) }, 502);
    }
  },
};

async function postJson(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = { raw };
  }
  return { res, data, raw };
}

async function sendTelegram(text, chatId, token) {
  const tk = token || CONFIG.TELEGRAM_BOT_TOKEN;
  const cid = chatId || CONFIG.TELEGRAM_CHAT_ID;
  if (!tk || !cid) throw new Error("توکن یا chat_id تلگرام تنظیم نشده است");
  const { data } = await postJson(`https://api.telegram.org/bot${tk}/sendMessage`, { chat_id: cid, text });
  if (data.ok === false) throw new Error(data.description || "خطا در ارسال به تلگرام");
  return data;
}

async function sendBale(text, chatId, token) {
  const tk = token || CONFIG.BALE_BOT_TOKEN;
  const cid = chatId || CONFIG.BALE_CHAT_ID;
  if (!tk || !cid) throw new Error("توکن یا chat_id بله تنظیم نشده است");
  const hosts = ["https://tapi.bale.ai", "https://api.bale.ai"];
  let last = "";
  for (const host of hosts) {
    try {
      const { data } = await postJson(`${host}/bot${tk}/sendMessage`, { chat_id: cid, text });
      if (data.ok !== false) return data;
      last = data.description || JSON.stringify(data);
    } catch (e) {
      last = String(e.message || e);
    }
  }
  throw new Error(last || "خطا در ارسال به بله");
}

async function sendEitaa(text, chatId, token) {
  const tk = token || CONFIG.ITA_BOT_TOKEN;
  const cid = chatId || CONFIG.ITA_CHAT_ID;
  if (!tk || !cid) throw new Error("توکن یا chat_id ایتا تنظیم نشده است");
  // درگاه رسمی ایتایار (form-urlencoded)
  const res = await fetch(`https://eitaayar.ir/api/${tk}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ chat_id: cid, text }).toString(),
  });
  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = { raw };
  }
  if (!res.ok || data.ok === false) throw new Error(data.description || raw.slice(0, 200));
  return data;
}

async function sendWhatsapp(text, to, token) {
  const tk = token || CONFIG.WHATSAPP_TOKEN;
  const target = (to || CONFIG.WHATSAPP_TO || "").replace(/\D/g, "");
  const i = tk.indexOf(":");
  const phoneNumberId = i > 0 ? tk.slice(0, i) : "";
  const accessToken = i > 0 ? tk.slice(i + 1) : "";
  if (!phoneNumberId || !accessToken) throw new Error("توکن واتساپ باید phoneNumberId:accessToken باشد");
  if (!target) throw new Error("شماره مقصد واتساپ وارد نشده است");
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: target,
      type: "text",
      text: { preview_url: false, body: text },
    }),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(raw.slice(0, 200));
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}
