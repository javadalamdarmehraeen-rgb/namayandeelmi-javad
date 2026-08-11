import { db, dbRetrySafe } from "@/db";
import { messageLogs, messengers, settings } from "@/db/schema";
import { bonusKeyOf } from "./defaults";
import { getProducts } from "./settings-server";
import { toPersianDigits } from "./jalali";
import { fetchWithRetry } from "./retry";
import { eq } from "drizzle-orm";
/* ============================================================
 *      
 *
 *  :     (  )
 *
 *  :
 *   -        
 *   -    (Exponential Backoff)   
 *   -       
 *   -     (    )
 *   -    /
 * ============================================================ */
export type Platform = "telegram" | "bale" | "eitaa" | "whatsapp";
export type MessengerTarget = {
  id?: number;
  platform: string;
  target: string;
  token: string;
  provider?: string;
  apiUrl?: string;
  label?: string;
};
export type SendResult = { ok: boolean; detail: string; via: "direct" | "proxy" | "none" };
export const PLATFORM_LABEL: Record<string, string> = {
  telegram: "",
  bale: "",
  eitaa: "",
  whatsapp: "",
};
/**       */
export const WHATSAPP_PROVIDERS = [
  {
    key: "whatsiplus",
    label: " (whatsiplus.ir)",
    hint: " API   whatsiplus.ir | :     ",
  },
  {
    key: "ultramsg",
    label: "UltraMsg",
    hint: "   instanceId:token | :      989121111111",
  },
  {
    key: "cloudapi",
    label: "WhatsApp Cloud API ()",
    hint: "   phoneNumberId:accessToken | :    ",
  },
  {
    key: "custom",
    label: " ",

    hint: " API   {phone}  {text}  {token}",
  },
] as const;
/* ------------------------------------------------------------------ */
/*                                                         */
/* ------------------------------------------------------------------ */
export type ProxyConfig = { url: string; enabled: boolean; secret?: string };
export const DEFAULT_PROXY: ProxyConfig = {
  url: process.env.MESSAGING_PROXY_URL || "https://namayandeelmi-javad.javadalamdar-mehraeen.workers.dev/",
  enabled: true,
  secret: "",
};
export async function getProxy(): Promise<ProxyConfig> {
  const rows = await dbRetrySafe(
    () => db.select().from(settings).where(eq(settings.key, "messagingProxy")).limit(1),
    [],
    "proxy:get",
  );
  const v = rows[0]?.value as ProxyConfig | undefined;
  return v && typeof v.url === "string" ? { ...DEFAULT_PROXY, ...v } : DEFAULT_PROXY;
}
export type TokenMap = Record<string, string>;
const FALLBACK_TOKENS: TokenMap = {
  bale: process.env.BALE_BOT_TOKEN || "1199464939:uhHpJVtcy__qdtFfN7iuzr4AH7bZBKPG85A",
  telegram: process.env.TELEGRAM_BOT_TOKEN || "",
  eitaa: process.env.EITAA_TOKEN || "",
  whatsapp: process.env.WHATSAPP_TOKEN || "",
};
/**             */
export async function getTokens(): Promise<TokenMap> {
  const rows = await dbRetrySafe(
    () => db.select().from(settings).where(eq(settings.key, "messengerTokens")).limit(1),
    [],
    "tokens:get",
  );
  const v = rows[0]?.value as TokenMap | undefined;
  return v && typeof v === "object" ? { ...FALLBACK_TOKENS, ...v } : FALLBACK_TOKENS;
}
export async function resolveToken(platform: string, rowToken?: string) {
  const t = (rowToken ?? "").trim();
  if (t) return t;
  return ((await getTokens())[platform] ?? "").trim();
}
/* ------------------------------------------------------------------ */
/*                                                         */
/* ------------------------------------------------------------------ */
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
export async function formatOrderMessage(o: OrderLike, withLocation = true) {
  const PRODUCTS = await getProducts();
  const L: string[] = [];
  L.push("   ");
  L.push("──────────────");
  L.push(` : ${toPersianDigits(o.id)}`);
  L.push(` : ${toPersianDigits(o.dateShamsi)}`);
  L.push(` : ${o.repName}`);
  L.push(` : ${o.pharmacyName}`);
  if (o.managerName) L.push(` : ${o.managerName}`);
  if (o.managerPhone) L.push(` : ${toPersianDigits(o.managerPhone)}`);
  if (o.address) L.push(`: ${o.address}`);
  if (withLocation && o.lat && o.lng) L.push(`: https://www.google.com/maps?q=${o.lat},${o.lng}`);

  L.push("────   ────");
  let totalUnits = 0;
  let totalBonus = 0;
  for (const p of PRODUCTS) {
    const q = Number(o.items?.[p.key] || 0);
    const b = Number(o.items?.[bonusKeyOf(p.key)] || 0);
    if (q || b) {
      totalUnits += q;
      totalBonus += b;
      L.push(`• ${p.label}: ${toPersianDigits(q)}${b ? ` ( ${toPersianDigits(b)})` : ""}`);
    }
  }
  L.push(` : ${toPersianDigits(totalUnits)}  | : ${toPersianDigits(totalBonus)} `);
  L.push("──────────────");
  if (o.distributor) L.push(` : ${o.distributor}`);
  if (o.visitor) L.push(` : ${o.visitor}`);
  if (o.notes) L.push(`: ${o.notes}`);
  return L.join("\n");
}
/* ------------------------------------------------------------------ */
/*                                              */
/* ------------------------------------------------------------------ */
const RETRY = { retries: 3, baseDelayMs: 1_000, maxDelayMs: 8_000, timeoutMs: 15_000 };
function friendly(platform: string, status: number, raw: string) {
  const s = raw.replace(/\s+/g, " ").slice(0, 220);
  if (status === 401 || status === 403) return ` ${platform}     (${status}) — ${s}`;
  if (status === 404) return `/ ${platform}   () — ${s}`;
  if (status === 400) return `   : ${s}`;
  return ` ${status}: ${s}`;
}
/**        ("true" / "false") */
function isTruthy(v: unknown): boolean | null {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["true", "success", "ok", "1", "sent"].includes(s)) return true;
    if (["false", "error", "failed", "0"].includes(s)) return false;
  }
  if (typeof v === "number") return v === 1 || v === 200;
  return null;
}
async function readJson(res: Response) {
  const raw = await res.text();
  try {
    return { raw, json: JSON.parse(raw) as Record<string, unknown> };
  } catch {
    return { raw, json: null };
  }
}
/**    —   Bot API     */
async function sendBotApi(base: string, token: string, chatId: string, text: string, label: string) {
  const res = await fetchWithRetry(
    `${base}/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: false }),
    },
    { ...RETRY, label },
  );
  const { raw, json } = await readJson(res);
  if (res.ok && json?.ok !== false) return { ok: true, detail: " " };
  const desc = (json?.description as string) ?? raw;
  return { ok: false, detail: friendly(label, res.status, desc) };
}
/**  —   (form-urlencoded) */
async function sendEitaa(token: string, chatId: string, text: string) {
  const res = await fetchWithRetry(
    `https://eitaayar.ir/api/${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ chat_id: chatId, text }).toString(),
    },
    { ...RETRY, label: "" },
  );
  const { raw, json } = await readJson(res);

  if (res.ok && json?.ok !== false) return { ok: true, detail: " " };
  return { ok: false, detail: friendly("", res.status, (json?.description as string) ?? raw) };
}
/**  —    */
async function sendWhatsapp(m: MessengerTarget, token: string, text: string) {
  const provider = m.provider || "whatsiplus";
  const digits = m.target.replace(/\D/g, "");
  if (provider === "whatsiplus") {
    // : https://api.whatsiplus.com/sendMsg/{apikey}?phonenumber=...&message=...
    const base = (m.apiUrl || "https://api.whatsiplus.com/sendMsg").replace(/\/$/, "");
    const url = `${base}/${token}?phonenumber=${encodeURIComponent(digits)}&message=${encodeURIComponent(text)}`;
    const res = await fetchWithRetry(url, { method: "GET" }, { ...RETRY, label: "" });
    const { raw, json } = await readJson(res);
    // whatsiplus           
    const okFlag = json ? isTruthy(json.success) ?? isTruthy(json.status) : null;
    const failed = okFlag === false || (json?.message && okFlag !== true);
    return res.ok && !failed
      ? { ok: true, detail: " " }
      : { ok: false, detail: `: ${(json?.message as string) ?? raw.slice(0, 180)}` };
  }
  if (provider === "ultramsg") {
    const [instance, apiToken] = token.split(":");
    if (!instance || !apiToken) return { ok: false, detail: " UltraMsg  instanceId:token " };
    const res = await fetchWithRetry(
      `https://api.ultramsg.com/${instance}/messages/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: apiToken, to: digits, body: text }).toString(),
      },
      { ...RETRY, label: "" },
    );
    const { raw, json } = await readJson(res);
    const sentOk = json ? isTruthy(json.sent) ?? isTruthy(json.success) : null;
    if (!res.ok || sentOk === false || json?.error) {
      return { ok: false, detail: `: ${(json?.error as string) ?? raw.slice(0, 180)}` };
    }
    return { ok: true, detail: " " };
  }
  if (provider === "cloudapi") {
    const i = token.indexOf(":");
    const phoneNumberId = i > 0 ? token.slice(0, i) : "";
    const accessToken = i > 0 ? token.slice(i + 1) : "";
    if (!phoneNumberId || !accessToken) {
      return { ok: false, detail: " Cloud API  phoneNumberId:accessToken " };
    }
    const res = await fetchWithRetry(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: digits,
          type: "text",
          text: { preview_url: false, body: text },
        }),
      },
      { ...RETRY, label: "" },
    );
    const { raw } = await readJson(res);
    return res.ok ? { ok: true, detail: " " } : { ok: false, detail: friendly("", res.status, raw) };
  }
  //  
  if (!m.apiUrl) return { ok: false, detail: "     " };
  const url = m.apiUrl
    .replace("{phone}", encodeURIComponent(digits))
    .replace("{text}", encodeURIComponent(text))
    .replace("{token}", encodeURIComponent(token));
  const res = await fetchWithRetry(url, { method: "GET" }, { ...RETRY, label: "" });
  const { raw, json } = await readJson(res);
  const okFlag = json ? isTruthy(json.success) ?? isTruthy(json.status) : null;
  if (!res.ok || okFlag === false) return { ok: false, detail: `: ${raw.slice(0, 180)}` };
  return { ok: true, detail: " " };
}
async function sendDirect(m: MessengerTarget, token: string, text: string): Promise<{ ok: boolean; detail: string }> {
  try {
    switch (m.platform) {

      case "telegram":
        return await sendBotApi("https://api.telegram.org", token, m.target, text, "");
      case "bale":
        return await sendBotApi("https://tapi.bale.ai", token, m.target, text, "");
      case "eitaa":
        return await sendEitaa(token, m.target, text);
      case "whatsapp":
        return await sendWhatsapp(m, token, text);
      default:
        return { ok: false, detail: "  " };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : " ";
    return {
      ok: false,
      detail: msg.toLowerCase().includes("abort")
        ? "   (Timeout) —           "
        : ` : ${msg}`,
    };
  }
}
/**     Cloudflare Worker (    ) */
async function sendViaProxy(proxy: ProxyConfig, m: MessengerTarget, token: string, text: string) {
  const alias = m.platform === "eitaa" ? "ita" : m.platform;
  try {
    const res = await fetchWithRetry(
      proxy.url.trim(),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(proxy.secret ? { "x-proxy-secret": proxy.secret } : {}),
        },
        body: JSON.stringify({
          messenger: alias,
          platform: m.platform,
          provider: m.provider,
          text,
          chatId: m.target,
          chat_id: m.target,
          token,
        }),
      },
      { ...RETRY, label: "proxy" },
    );
    const { raw, json } = await readJson(res);
    const failed = json && (json.success === false || json.ok === false);
    if (res.ok && !failed) return { ok: true, detail: "  (  )" };
    const detail = (json?.error as string) ?? (json?.description as string) ?? raw.slice(0, 200);
    return { ok: false, detail: `: ${detail}` };
  } catch (err) {
    return { ok: false, detail: `   : ${err instanceof Error ? err.message : ""}` };
  }
}
/**
 *      .
 *           .
 */
export async function sendOne(
  input: MessengerTarget,
  text: string,
  proxyOverride?: ProxyConfig,
): Promise<SendResult> {
  if (!input.target.trim()) return { ok: false, detail: "    ", via: "none" };
  const token = await resolveToken(input.platform, input.token);
  const proxy = proxyOverride ?? (await getProxy());
  if (!token && input.platform !== "whatsapp") {
    if (!proxy.enabled) return { ok: false, detail: "    ", via: "none" };
  }
  // )   (    )
  if (token) {
    const direct = await sendDirect(input, token, text);
    if (direct.ok) return { ...direct, via: "direct" };
    // )       
    if (proxy.enabled && proxy.url) {
      const viaProxy = await sendViaProxy(proxy, input, token, text);
      if (viaProxy.ok) return { ...viaProxy, via: "proxy" };
      return { ok: false, detail: `: ${direct.detail} | ${viaProxy.detail}`, via: "none" };
    }

    return { ...direct, via: "none" };
  }
  //   (     )
  if (proxy.enabled && proxy.url) {
    const viaProxy = await sendViaProxy(proxy, input, "", text);
    return { ...viaProxy, via: viaProxy.ok ? "proxy" : "none" };
  }
  return { ok: false, detail: "       ", via: "none" };
}
/* ------------------------------------------------------------------ */
/*                                            */
/* ------------------------------------------------------------------ */
export type DispatchReport = {
  total: number;
  sent: number;
  failed: number;
  summary: string;
  results: { platform: string; label: string; target: string; ok: boolean; detail: string }[];
};
/**
 *      .
 *       (Promise.allSettled).
 */
export async function dispatchText(text: string, orderId?: number): Promise<DispatchReport> {
  const targets = await dbRetrySafe(
    () => db.select().from(messengers).where(eq(messengers.enabled, true)),
    [],
    "messengers:list",
  );
  if (targets.length === 0) {
    return { total: 0, sent: 0, failed: 0, summary: "    ", results: [] };
  }
  const proxy = await getProxy();
  const settled = await Promise.allSettled(
    targets.map(async (t) => {
      const r = await sendOne(
        {
          id: t.id,
          platform: t.platform,
          target: t.target,
          token: t.token,
          provider: t.provider,
          apiUrl: t.apiUrl,
          label: t.label,
        },
        text,
        proxy,
      );
      //      
      await dbRetrySafe(
        () =>
          db.insert(messageLogs).values({
            orderId: orderId ?? null,
            platform: t.platform,
            target: t.target,
            ok: r.ok,
            detail: r.detail,
          }),
        undefined,
        "messageLog:insert",
      );
      await dbRetrySafe(
        () =>
          db
            .update(messengers)
            .set({
              lastStatus: `${r.ok ? "" : ""} ${r.detail}`.slice(0, 400),
              ...(r.ok ? { lastOkAt: new Date() } : { lastErrorAt: new Date() }),
            })
            .where(eq(messengers.id, t.id)),
        undefined,
        "messenger:status",
      );
      return {
        platform: t.platform,
        label: t.label || PLATFORM_LABEL[t.platform] || t.platform,

        target: t.target,
        ok: r.ok,
        detail: r.detail,
      };
    }),
  );
  const results = settled.map((s, i) =>
    s.status === "fulfilled"
      ? s.value
      : {
          platform: targets[i].platform,
          label: targets[i].label || PLATFORM_LABEL[targets[i].platform],
          target: targets[i].target,
          ok: false,
          detail: "   ",
        },
  );
  const sent = results.filter((r) => r.ok).length;
  const summary = results
    .map((r) => `${PLATFORM_LABEL[r.platform] ?? r.platform}: ${r.ok ? "  " : ` ${r.detail}`}`)
    .join(" | ");
  return { total: results.length, sent, failed: results.length - sent, summary, results };
}
/**        */
export async function dispatchOrder(order: OrderLike): Promise<string> {
  const text = await formatOrderMessage(order);
  const report = await dispatchText(text, order.id);
  return report.summary;
}
/* ------------------------------------------------------------------ */
/*   chat_id ( / )                                          */
/* ------------------------------------------------------------------ */
export type ChatInfo = { id: string; title: string; type: string };
export async function fetchUpdates(platform: string, rowToken?: string) {
  const token = await resolveToken(platform, rowToken);
  if (!token) return { ok: false, detail: "   ", chats: [] as ChatInfo[] };
  const bases =
    platform === "telegram"
      ? ["https://api.telegram.org"]
      : platform === "bale"
        ? ["https://tapi.bale.ai", "https://api.bale.ai"]
        : [];
  if (bases.length === 0) return { ok: false, detail: "    ", chats: [] as ChatInfo[] };
  const chats = new Map<string, ChatInfo>();
  let lastErr = "";
  const consume = (raw: string) => {
    try {
      const j = JSON.parse(raw);
      for (const u of j?.result ?? []) {
        const c = u?.message?.chat ?? u?.channel_post?.chat ?? u?.edited_message?.chat;
        if (!c?.id) continue;
        chats.set(String(c.id), {
          id: String(c.id),
          title: c.title || [c.first_name, c.last_name].filter(Boolean).join(" ") || c.username || String(c.id),
          type: c.type === "private" ? "" : c.type === "group" || c.type === "supergroup" ? "" : "",
        });
      }
      return j?.ok !== false;
    } catch {
      return false;
    }
  };
  for (const base of bases) {
    try {
      const res = await fetchWithRetry(`${base}/bot${token}/getUpdates?limit=100`, { method: "GET" }, { retries: 2, time
outMs: 15_000 });
      const raw = await res.text();
      if (res.ok && consume(raw)) return { ok: true, detail: "", chats: [...chats.values()] };
      lastErr = raw.slice(0, 200);
    } catch (err) {
      lastErr = err instanceof Error ? err.message : " ";
    }
  }

  const proxy = await getProxy();
  if (proxy.enabled && proxy.url) {
    try {
      const res = await fetchWithRetry(
        proxy.url,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(proxy.secret ? { "x-proxy-secret": proxy.secret } : {}) },
          body: JSON.stringify({ action: "getUpdates", messenger: platform === "eitaa" ? "ita" : platform, token }),
        },
        { retries: 2, timeoutMs: 15_000 },
      );
      const raw = await res.text();
      if (res.ok && consume(raw)) return { ok: true, detail: "  ", chats: [...chats.values()] };
      lastErr = raw.slice(0, 200);
    } catch (err) {
      lastErr = err instanceof Error ? err.message : lastErr;
    }
  }
  return {
    ok: false,
    detail: `   : ${lastErr}.            .`,
    chats: [] as ChatInfo[],
  };
}
