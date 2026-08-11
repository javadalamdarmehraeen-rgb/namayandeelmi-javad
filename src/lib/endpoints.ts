"use client";
/**
 * ============================================================
 *     (Multi-Endpoint Failover)
 * ------------------------------------------------------------
 *       :
 *    • https://ndcohub.ir                      (  )
 *    • https://namayandeelmi-javad.onrender.com (  )
 *
 *           .
 *            
 *   .       .
 * ============================================================
 */
const KEY_ACTIVE = "sek_active_endpoint";
const KEY_CHECKED = "sek_endpoint_checked_at";
const RECHECK_MS = 5 * 60 * 1000;
const PROBE_TIMEOUT = 6000;
/**       (      ) */
export function endpointList(): string[] {
  const raw = process.env.NEXT_PUBLIC_ENDPOINTS || "";
  const list = raw
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter((s) => s.startsWith("http"));
  if (list.length) return list;
  // :    
  return ["https://ndcohub.ir", "https://namayandeelmi-javad.onrender.com"];
}
/**         —     */
export function currentOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin.replace(/\/$/, "");
}
export function getActiveEndpoint(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(KEY_ACTIVE) || currentOrigin();
  } catch {
    return currentOrigin();
  }
}
export function setActiveEndpoint(url: string) {
  try {
    localStorage.setItem(KEY_ACTIVE, url.replace(/\/$/, ""));
    localStorage.setItem(KEY_CHECKED, String(Date.now()));
  } catch {
    /* ignore */
  }
}
/**  :    →   →  */

export function orderedEndpoints(): string[] {
  const origin = currentOrigin();
  const active = getActiveEndpoint();
  const all = endpointList();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of [origin, active, ...all]) {
    const clean = (u || "").replace(/\/$/, "");
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      out.push(clean);
    }
  }
  return out;
}
async function probe(base: string): Promise<number | null> {
  const t0 = performance.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT);
    const res = await fetch(`${base}/ping?t=${Date.now()}`, {
      cache: "no-store",
      signal: ctrl.signal,
      credentials: "omit",
      mode: base === currentOrigin() ? "same-origin" : "cors",
    });
    clearTimeout(timer);
    return res.ok ? Math.round(performance.now() - t0) : null;
  } catch {
    return null;
  }
}
/**       */
export async function pickFastestEndpoint(force = false): Promise<{ url: string; ms: number | null }[]> {
  const checkedAt = Number(localStorage.getItem(KEY_CHECKED) ?? 0);
  const list = orderedEndpoints();
  if (!force && Date.now() - checkedAt < RECHECK_MS) {
    return [{ url: getActiveEndpoint(), ms: null }];
  }
  const results = await Promise.all(list.map(async (u) => ({ url: u, ms: await probe(u) })));
  const alive = results.filter((r) => r.ms !== null).sort((a, b) => (a.ms ?? 9e9) - (b.ms ?? 9e9));
  if (alive.length) setActiveEndpoint(alive[0].url);
  return results;
}
/**
 *  :      .
 *     «/api/...»  .
 */
export async function multiFetch(path: string, init: RequestInit = {}, original?: typeof fetch): Promise<Response> {
  const doFetch = original ?? fetch;
  const endpoints = orderedEndpoints();
  let lastErr: unknown;
  for (let i = 0; i < endpoints.length; i++) {
    const base = endpoints[i];
    const isSelf = base === currentOrigin();
    const url = isSelf ? path : `${base}${path}`;
    try {
      const res = await doFetch(url, {
        ...init,
        //     /CORS  
        credentials: isSelf ? (init.credentials ?? "same-origin") : "include",
        mode: isSelf ? undefined : "cors",
      });
      //            
      if (res.status < 500) {
        if (!isSelf) setActiveEndpoint(base);
        return res;
      }
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("     ");
}
