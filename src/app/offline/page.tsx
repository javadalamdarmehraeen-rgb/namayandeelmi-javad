"use client";

import { useCallback, useEffect, useState } from "react";
import { getCachedUser } from "@/lib/offline-session";

/**
 * صفحه «ارتباط برقرار نیست» — بن‌بست نیست:
 *  - هر ۸ ثانیه خودکار اتصال را بررسی می‌کند و به‌محض برقراری وارد برنامه می‌شود
 *  - دکمه «ادامه در حالت آفلاین» کاربر را وارد پنل می‌کند تا کارش را انجام دهد
 */
export default function OfflinePage() {
  const [checking, setChecking] = useState(false);
  const [tries, setTries] = useState(0);
  const [target, setTarget] = useState("/login");

  useEffect(() => {
    const u = getCachedUser();
    if (u) setTarget(u.role === "rep" ? "/panel" : "/admin");
  }, []);

  const check = useCallback(
    async (auto = false) => {
      setChecking(true);
      if (!auto) setTries((t) => t + 1);
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 8000);
        const res = await fetch(`/ping?t=${Date.now()}`, { cache: "no-store", signal: ctrl.signal });
        clearTimeout(timer);
        if (res.ok) {
          window.location.replace(target);
          return true;
        }
      } catch {
        /* هنوز آفلاین */
      } finally {
        setChecking(false);
      }
      return false;
    },
    [target],
  );

  useEffect(() => {
    const iv = setInterval(() => check(true), 8000);
    const onOnline = () => check(true);
    window.addEventListener("online", onOnline);
    return () => {
      clearInterval(iv);
      window.removeEventListener("online", onOnline);
    };
  }, [check]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 p-6 text-center">
      <div className="text-5xl">📡</div>
      <h1 className="text-lg font-black text-slate-800">ارتباط با سرور برقرار نیست</h1>
      <p className="max-w-sm text-sm leading-7 text-slate-600">
        لطفاً اتصال اینترنت خود را بررسی کنید. نگران نباشید — می‌توانید وارد برنامه شوید و کارتان را انجام دهید؛
        اطلاعات ذخیره می‌شود و به‌محض وصل شدن اینترنت ارسال خواهد شد.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => check(false)}
          disabled={checking}
          className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {checking ? "در حال بررسی..." : "🔄 تلاش مجدد"}
        </button>
        <a href={target} className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-teal-700 ring-1 ring-teal-300">
          ↩ ادامه در حالت آفلاین
        </a>
        <a href="/diagnostics" className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-300">
          🩺 عیب‌یابی
        </a>
      </div>

      <p className="text-[11px] text-slate-400">
        بررسی خودکار هر ۸ ثانیه انجام می‌شود{tries > 0 ? ` — ${tries.toLocaleString("fa-IR")} تلاش دستی` : ""}
      </p>

      <div className="mt-2 max-w-sm rounded-xl bg-white p-3 text-right text-[11px] leading-6 text-slate-500 ring-1 ring-slate-200">
        <b className="text-slate-700">اگر با وای‌فای کار می‌کند ولی با اینترنت موبایل نه:</b> اپراتور شما دسترسی به
        سرور را محدود کرده است. برنامه با داده ذخیره‌شده کار می‌کند و ارسال‌ها در صف می‌مانند تا به شبکه‌ای وصل شوید
        که دسترسی دارد.
      </div>
    </main>
  );
}
