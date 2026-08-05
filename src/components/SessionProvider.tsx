"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export type Me = {
  id: number;
  username: string;
  fullName: string;
  role: "admin" | "supervisor" | "rep";
  phone: string;
  requirePhone: boolean;
  permissions: string[];
};

const TOKEN_KEY = "sek_token";

/** توکن نشست مخصوص همین تب مرورگر */
export function setTabToken(token: string) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}
export function getTabToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
export function clearTabToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

let patched = false;
/** همه درخواست‌های /api این تب، توکن اختصاصی همین تب را حمل می‌کنند. */
export function patchFetch() {
  if (patched || typeof window === "undefined") return;
  patched = true;
  const original = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url.startsWith("/api") || url.startsWith(window.location.origin + "/api")) {
      const token = getTabToken();
      const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
      if (token) headers.set("x-auth-token", token);
      // تلاش مجدد خودکار روی اینترنت‌های ضعیف/ناپایدار (موبایل، اینترنت ملی، VPN)
      const attempt = async (n: number): Promise<Response> => {
        try {
          return await original(input, { ...init, headers, cache: init?.cache ?? "no-store" });
        } catch (err) {
          if (n < 2 && typeof navigator !== "undefined" && navigator.onLine) {
            await new Promise((r) => setTimeout(r, 900 * (n + 1)));
            return attempt(n + 1);
          }
          throw err;
        }
      };
      return attempt(0);
    }
    return original(input, init);
  };
}

type Ctx = { me: Me | null; loading: boolean; reload: () => Promise<void>; logout: () => Promise<void> };
const SessionCtx = createContext<Ctx>({ me: null, loading: true, reload: async () => {}, logout: async () => {} });

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
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const res = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
    if (res?.ok) {
      const d = await res.json();
      setMe(d.user);
    } else setMe(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const logout = useCallback(async () => {
    clearTabToken();
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    setMe(null);
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    if (loading) return;
    if (requireAuth && !me) router.replace("/login");
    else if (adminOnly && me && me.role === "rep") router.replace("/panel");
  }, [loading, me, requireAuth, adminOnly, router]);

  if (requireAuth && (loading || !me)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">
        در حال بارگذاری...
      </div>
    );
  }

  return <SessionCtx.Provider value={{ me, loading, reload, logout }}>{children}</SessionCtx.Provider>;
}
