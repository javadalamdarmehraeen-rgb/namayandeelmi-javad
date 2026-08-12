"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  cacheUser,
  clearToken,
  getCachedUser,
  getToken,
  saveToken,
  type CachedUser,
} from "@/lib/offline-session";
import { currentOrigin, orderedEndpoints, setActiveEndpoint } from "@/lib/endpoints";
export type Me = CachedUser;
export function setTabToken(token: string, persist = true) {
  saveToken(token, persist);
}
export const getTabToken = getToken;
export const clearTabToken = clearToken;
let patched = false;
/**
 *   /api         
 *  (   VPN)       .
 */
export function patchFetch() {
  if (patched || typeof window === "undefined") return;
  patched = true;
  const original = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const isApi = url.startsWith("/api") || url.startsWith(window.location.origin + "/api");
    if (!isApi) return original(input, init);
    const token = getToken();
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    if (token) headers.set("x-auth-token", token);
    //  :      (  Render   )
    type Conn = { effectiveType?: string; saveData?: boolean };
    const conn = (navigator as Navigator & { connection?: Conn }).connection;
    const slow = conn?.saveData || ["slow-2g", "2g", "3g"].includes(conn?.effectiveType ?? "");
    const baseTimeout = slow ? 45000 : 25000;
    //      
    const relPath = url.startsWith("http") ? url.replace(currentOrigin(), "") : url;
    const tryOnce = async (target: string, extraMs: number): Promise<Response> => {
      const isSelf = target === currentOrigin();
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), baseTimeout + extraMs);
      try {
        return await original(isSelf ? relPath : `${target}${relPath}`, {
          ...init,
          headers,
          credentials: isSelf ? (init?.credentials ?? "same-origin") : "include",
          mode: isSelf ? undefined : "cors",
          signal: init?.signal ?? ctrl.signal,
          cache: init?.cache ?? "no-store",
        });
      } finally {
        clearTimeout(timer);
      }
    };
    /**
     *    (    )   .
     *    /      .
     */
    const attempt = async (): Promise<Response> => {
      const targets = orderedEndpoints();
      let lastErr: unknown;
      for (let ti = 0; ti < targets.length; ti++) {
        const target = targets[ti];
        const retries = ti === 0 ? 2 : 1; //     
        for (let n = 0; n <= retries; n++) {
          try {
            const res = await tryOnce(target, n * 8000);
            if (res.status < 500) {
              if (ti > 0) setActiveEndpoint(target);
              return res;
            }
            lastErr = new Error(`HTTP ${res.status}`);
          } catch (err) {
            lastErr = err;

          }
          if (n < retries && navigator.onLine) await new Promise((r) => setTimeout(r, 1000 * (n + 1)));
        }
      }
      throw lastErr instanceof Error ? lastErr : new Error("   ");
    };
    return attempt();
  };
}
type Ctx = {
  me: Me | null;
  loading: boolean;
  offline: boolean;
  reload: () => Promise<void>;
  logout: () => Promise<void>;
};
const SessionCtx = createContext<Ctx>({
  me: null,
  loading: true,
  offline: false,
  reload: async () => {},
  logout: async () => {},
});
export function useSession() {
  return useContext(SessionCtx);
}
export default function SessionProvider({
  children,
  require: requireAuth = false,
  adminOnly = false,
}: {
  children: ReactNode;
  require?: boolean;
  adminOnly?: boolean;
}) {
  patchFetch();
  const router = useRouter();
  //           
  const [me, setMe] = useState<Me | null>(() => getCachedUser());
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const reload = useCallback(async () => {
    const cached = getCachedUser();
    if (cached) setMe(cached);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setOffline(true);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const d = await res.json();
        if (d?.user) {
          setMe(d.user);
          cacheUser(d.user);
          setOffline(false);
        } else if (!cached) setMe(null);
      } else if (res.status === 401) {
        //       → 
        clearToken();
        setMe(null);
        setOffline(false);
      }
    } catch {
      //     →     
      setOffline(true);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    const onOnline = () => reload();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [reload]);
  const logout = useCallback(async () => {
    clearToken();
    setMe(null);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/login");
  }, [router]);
  useEffect(() => {
    if (loading) return;
    if (requireAuth && !me) router.replace("/login");
    else if (adminOnly && me && me.role === "rep") router.replace("/panel");
  }, [loading, me, requireAuth, adminOnly, router]);
  if (requireAuth && !me) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100 p-6 text-center">
        <div className="size-10 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
        <p className="text-sm text-slate-500">{loading ? "  ..." : "     ..."}</p>
        {offline ? (
          <p className="max-w-xs text-xs leading-6 text-amber-700">
                .         .
          </p>
        ) : null}
      </div>
    );
  }
  return (
    <SessionCtx.Provider value={{ me, loading, offline, reload, logout }}>{children}</SessionCtx.Provider>
  );
}
