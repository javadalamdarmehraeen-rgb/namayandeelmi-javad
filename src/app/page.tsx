"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { patchFetch } from "@/components/SessionProvider";
import { getCachedUser } from "@/lib/offline-session";

export default function Home() {
  const router = useRouter();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    patchFetch();

    // ۱) اگر نشست ذخیره‌شده داریم، بدون انتظار برای شبکه وارد می‌شویم (کار روی هر اینترنتی)
    const cached = getCachedUser();
    if (cached) {
      router.replace(cached.role === "rep" ? "/panel" : "/admin");
      return;
    }

    // ۲) اگر آفلاین هستیم مستقیم به صفحه ورود
    if (!navigator.onLine) {
      router.replace("/login");
      return;
    }

    const slowTimer = setTimeout(() => setSlow(true), 6000);
    // بیدارکردن سرور (Render رایگان بعد از بی‌کاری خاموش می‌شود)
    fetch("/api/ping", { cache: "no-store" }).catch(() => undefined);

    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => router.replace(!d?.user ? "/login" : d.user.role === "rep" ? "/panel" : "/admin"))
      .catch(() => router.replace("/login"))
      .finally(() => clearTimeout(slowTimer));

    return () => clearTimeout(slowTimer);
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100 p-6 text-center">
      <div className="size-10 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      <p className="text-sm font-bold text-slate-600">در حال بارگذاری «ثبت اطلاعات کل»...</p>
      {slow ? (
        <p className="max-w-xs text-xs leading-6 text-slate-500">
          اینترنت کند است یا سرور در حال بیدار شدن. چند لحظه صبر کنید — برنامه به‌صورت خودکار ادامه می‌دهد.
        </p>
      ) : null}
      <a href="/login" className="mt-2 text-xs font-bold text-teal-700 underline">
        رفتن مستقیم به صفحه ورود
      </a>
    </main>
  );
}
