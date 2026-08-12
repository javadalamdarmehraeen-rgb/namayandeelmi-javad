/**
 * ============================================================
 *       «  »
 *  Cloudflare Worker —   (   )
 * ------------------------------------------------------------
 *        :
 *   )   chat_id      →   
 *               .
 *   )          .
 *   )    (WhatsApp Cloud API).
 *   )   JSON + CORS +   (x-proxy-secret).
 *   )        (tapi  api).
 * ============================================================
 */
const CONFIG = {
  //          ()
  TELEGRAM_BOT_TOKEN: "",
  TELEGRAM_CHAT_ID: "",
  BALE_BOT_TOKEN: "",
  BALE_CHAT_ID: "",
  ITA_BOT_TOKEN: "",
  ITA_CHAT_ID: "",
  WHATSAPP_TOKEN: "", //   phoneNumberId:accessToken
  WHATSAPP_TO: "",
  //        x-proxy-secret     
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
    if (request.method !== "POST") return json({ success: false, error: " POST  " }, 405);
    if (CONFIG.PROXY_SECRET && request.headers.get("x-proxy-secret") !== CONFIG.PROXY_SECRET) {
      return json({ success: false, error: "   " }, 401);
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ success: false, error: "   JSON " }, 400);
    }
    //   getUpdates   chat_id
    if (body.action === "getUpdates") {
      const mg = String(body.messenger || body.platform || "").toLowerCase();
      const tk = body.token || (mg === "telegram" ? CONFIG.TELEGRAM_BOT_TOKEN : CONFIG.BALE_BOT_TOKEN);
      if (!tk) return json({ ok: false, error: "   " }, 400);
      const bases = mg === "telegram" ? ["https://api.telegram.org"] : ["https://tapi.bale.ai", "https://api.bale.ai"];
      for (const base of bases) {
        try {
          const r = await fetch(`${base}/bot${tk}/getUpdates?limit=100`);
          const raw = await r.text();
          if (r.ok) return new Response(raw, { headers: { "Content-Type": "application/json", ...CORS } });
        } catch {
          /* next host */
        }
      }
      return json({ ok: false, error: "    " }, 502);
    }
    const messenger = String(body.messenger || body.platform || "").toLowerCase();
    const text = body.text;

    const chatId = body.chatId || body.chat_id;
    const token = body.token;
    if (!messenger) return json({ success: false, error: ' "messenger"  ' }, 400);
    if (!text) return json({ success: false, error: ' "text"  ' }, 400);
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
          result = await sendWhatsapp(text, chatId, token, body.provider);
          break;
        default:
          return json({ success: false, error: "  " }, 400);
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
  if (!tk || !cid) throw new Error("  chat_id    ");
  const { data } = await postJson(`https://api.telegram.org/bot${tk}/sendMessage`, { chat_id: cid, text });
  if (data.ok === false) throw new Error(data.description || "    ");
  return data;
}
async function sendBale(text, chatId, token) {
  const tk = token || CONFIG.BALE_BOT_TOKEN;
  const cid = chatId || CONFIG.BALE_CHAT_ID;
  if (!tk || !cid) throw new Error("  chat_id    ");
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
  throw new Error(last || "    ");
}
async function sendEitaa(text, chatId, token) {
  const tk = token || CONFIG.ITA_BOT_TOKEN;
  const cid = chatId || CONFIG.ITA_CHAT_ID;
  if (!tk || !cid) throw new Error("  chat_id    ");
  //    (form-urlencoded)
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
async function sendWhatsapp(text, to, token, provider) {
  const p = (provider || "cloudapi").toLowerCase();
  const digits = String(to || CONFIG.WHATSAPP_TO || "").replace(/\D/g, "");
  const tk = token || CONFIG.WHATSAPP_TOKEN;
  if (p === "whatsiplus") {
    const r = await fetch(
      `https://api.whatsiplus.com/sendMsg/${tk}?phonenumber=${encodeURIComponent(digits)}&message=${encodeURIComponent(t
ext)}`
    );
    const raw = await r.text();
    let d;
    try { d = JSON.parse(raw); } catch { d = { raw }; }
    const okFlag = String(d.success ?? d.status ?? "").toLowerCase();
    if (!r.ok || okFlag === "false" || okFlag === "error") throw new Error(d.message || raw.slice(0, 180));
    return d;
  }
  if (p === "ultramsg") {
    const [instance, apiToken] = String(tk).split(":");
    if (!instance || !apiToken) throw new Error(" UltraMsg  instanceId:token ");
    const r = await fetch(`https://api.ultramsg.com/${instance}/messages/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: apiToken, to: digits, body: text }).toString(),
    });
    const raw = await r.text();
    if (!r.ok) throw new Error(raw.slice(0, 180));
    try { return JSON.parse(raw); } catch { return { raw }; }
  }
  return sendWhatsappCloud(text, digits, tk);
}
async function sendWhatsappCloud(text, to, token) {
  const tk = token || CONFIG.WHATSAPP_TOKEN;
  const target = String(to || CONFIG.WHATSAPP_TO || "").replace(/\D/g, "");
  const i = String(tk).indexOf(":");
  const phoneNumberId = i > 0 ? tk.slice(0, i) : "";
  const accessToken = i > 0 ? tk.slice(i + 1) : "";
  if (!phoneNumberId || !accessToken) throw new Error("   phoneNumberId:accessToken ");
  if (!target) throw new Error("     ");
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
