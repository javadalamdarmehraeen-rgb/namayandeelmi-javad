"use client";
/**
 *            .
 *      :
 *   sessionStorage →    (    =  )
 *   localStorage   →   «   »      
 */
export type CachedUser = {
  id: number;
  username: string;
  fullName: string;
  role: "admin" | "supervisor" | "rep";
  roleKey: string;
  roleLabel: string;
  phone: string;
  requirePhone: boolean;
  permissions: string[];
};

const TOKEN_TAB = "sek_token";
const TOKEN_PERSIST = "sek_token_p";
const USER_CACHE = "sek_user_cache";
const CACHE_AT = "sek_user_cache_at";
/**   :   */
const MAX_AGE = 14 * 24 * 60 * 60 * 1000;
const safeGet = (store: Storage | undefined, k: string) => {
  try {
    return store?.getItem(k) ?? null;
  } catch {
    return null;
  }
};
const safeSet = (store: Storage | undefined, k: string, v: string) => {
  try {
    store?.setItem(k, v);
  } catch {
    /* ignore */
  }
};
const safeDel = (store: Storage | undefined, k: string) => {
  try {
    store?.removeItem(k);
  } catch {
    /* ignore */
  }
};
export function saveToken(token: string, persist: boolean) {
  if (typeof window === "undefined") return;
  safeSet(sessionStorage, TOKEN_TAB, token);
  if (persist) safeSet(localStorage, TOKEN_PERSIST, token);
}
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return safeGet(sessionStorage, TOKEN_TAB) ?? safeGet(localStorage, TOKEN_PERSIST);
}
export function clearToken() {
  if (typeof window === "undefined") return;
  safeDel(sessionStorage, TOKEN_TAB);
  safeDel(localStorage, TOKEN_PERSIST);
  safeDel(localStorage, USER_CACHE);
  safeDel(localStorage, CACHE_AT);
}
export function cacheUser(u: CachedUser) {
  if (typeof window === "undefined") return;
  safeSet(localStorage, USER_CACHE, JSON.stringify(u));
  safeSet(localStorage, CACHE_AT, String(Date.now()));
}
/**          */
export function getCachedUser(): CachedUser | null {
  if (typeof window === "undefined") return null;
  const raw = safeGet(localStorage, USER_CACHE);
  const at = Number(safeGet(localStorage, CACHE_AT) ?? 0);
  if (!raw) return null;
  if (at && Date.now() - at > MAX_AGE) return null;
  //            
  if (!getToken()) return null;
  try {
    return JSON.parse(raw) as CachedUser;
  } catch {
    return null;
  }
}
