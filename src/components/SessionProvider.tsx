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

export type Me = CachedUser;

export function setTabToken(token: string, persist = true) {
  saveToken(token, persist);
}
export const getTabToken = getToken;
export const clearTabToken = clearToken;

let patched = false;

/**
 * همه درخواست‌های /api توکن این نشست را حمل می‌کنند و روی اینترنت‌های
 * ضعیف (موبایل، اینترنت ملی، VPN) چند بار با فاصله تلاش مجدد می‌کنند.
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

    // مهلت پویا: روی شبکه کند مهلت بیشتر (سرور رایگان Render گاهی سرد است)
    type Conn = { effectiveType?: string; saveData?: boolean };
    const conn = (navigator as Navigator & { connection?: Conn }).connection;
    const slow = conn?.saveData || ["slow-2g", "2g", "3g"].includes(conn?.effectiveType ?? "");
    const baseTimeout = slow ? 45000 : 25000;

    const attempt = async (n: number): Promise<Response> => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), baseTimeout + n * 10000);
      try {
        const res = await original(input, {
          ...init,
          headers,
          signal: init?.signal ?? ctrl.signal,
          cache: init?.cache ?? "no-store",
        });
        return res;
      } catch (err) {
        if (n < 2 && navigator.onLine) {
          await new Promise((r) => setTimeout(r, 1200 * (n + 1)));
          return attempt(n + 1);
        }
        throw err;
      } finally {
        clearTimeout(timer);
      }
    };
    return attempt(0);
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
  // نشست ذخیره‌شده بلافاصله استفاده می‌شود تا برنامه آفلاین هم باز شود
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
        // سرور صریحاً نشست را رد کرد → خروج
        clearToken();
        setMe(null);
        setOffline(false);
      }
    } catch {
      // سرور در دسترس نیست → با نشست ذخیره‌شده ادامه می‌دهیم
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
        <p className="text-sm text-slate-500">{loading ? "در حال بارگذاری..." : "در حال انتقال به صفحه ورود..."}</p>
        {offline ? (
          <p className="max-w-xs text-xs leading-6 text-amber-700">
            ارتباط با سرور برقرار نیست. اگر قبلاً وارد شده‌اید، برنامه به‌صورت آفلاین باز می‌شود.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <SessionCtx.Provider value={{ me, loading, offline, reload, logout }}>{children}</SessionCtx.Provider>
  );
}
