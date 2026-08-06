"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Badge, Button, Card, SectionTitle } from "@/components/ui";
import { getDeviceId, getDeviceInfo, readSimStatus } from "@/lib/device";
import { getCachedUser, getToken } from "@/lib/offline-session";
import { toPersianDigits } from "@/lib/jalali";

type Row = { key: string; label: string; state: "ok" | "warn" | "fail" | "run"; detail: string };

export default function DiagnosticsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [cacheInfo, setCacheInfo] = useState("");
  const [queue, setQueue] = useState<number | null>(null);

  const put = (r: Row) => setRows((p) => [...p.filter((x) => x.key !== r.key), r]);

  const run = useCallback(async () => {
    setBusy(true);
    setRows([]);

    // ۱) وضعیت شبکه دستگاه
    const sim = readSimStatus();
    type Conn = { effectiveType?: string; type?: string; downlink?: number; rtt?: number; saveData?: boolean };
    const conn = (navigator as Navigator & { connection?: Conn }).connection;
    put({
      key: "net",
      label: "اتصال شبکه دستگاه",
      state: navigator.onLine ? "ok" : "fail",
      detail: navigator.onLine
        ? `نوع: ${conn?.type ?? "نامشخص"} | کیفیت: ${conn?.effectiveType ?? "?"} | سرعت تقریبی: ${conn?.downlink ?? "?"}Mb | تاخیر: ${conn?.rtt ?? "?"}ms${conn?.saveData ? " | حالت کم‌مصرف روشن" : ""}`
        : "دستگاه آفلاین است",
    });

    // ۲) سرویس‌ورکر
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      put({
        key: "sw",
        label: "سرویس‌ورکر (موتور آفلاین)",
        state: reg?.active ? "ok" : "warn",
        detail: reg?.active
          ? "فعال است — برنامه بدون اینترنت هم باز می‌شود"
          : "هنوز فعال نشده؛ صفحه را یک بار رفرش کنید",
      });
    } else {
      put({ key: "sw", label: "سرویس‌ورکر", state: "fail", detail: "مرورگر پشتیبانی نمی‌کند" });
    }

    // ۳) حجم پیش‌کش
    try {
      const names = await caches.keys();
      let total = 0;
      for (const n of names) {
        const c = await caches.open(n);
        total += (await c.keys()).length;
      }
      put({
        key: "cache",
        label: "فایل‌های ذخیره‌شده آفلاین",
        state: total > 30 ? "ok" : total > 0 ? "warn" : "fail",
        detail:
          total > 30
            ? `${toPersianDigits(total)} فایل کش شده — برنامه کامل آفلاین کار می‌کند`
            : `فقط ${toPersianDigits(total)} فایل کش شده؛ یک بار با اینترنت پایدار صفحه را باز کنید`,
      });
      setCacheInfo(`${total} فایل در ${names.length} حافظه`);
    } catch {
      put({ key: "cache", label: "حافظه آفلاین", state: "fail", detail: "دسترسی به حافظه ممکن نیست" });
    }

    // ۴) پینگ سرور (بدون دیتابیس)
    const t0 = performance.now();
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 20000);
      const r = await fetch(`/api/ping?t=${Date.now()}`, { cache: "no-store", signal: ctrl.signal });
      clearTimeout(to);
      const ms = Math.round(performance.now() - t0);
      put({
        key: "ping",
        label: "دسترسی به سرور",
        state: r.ok ? (ms < 3000 ? "ok" : "warn") : "fail",
        detail: r.ok
          ? `پاسخ در ${toPersianDigits(ms)} میلی‌ثانیه${ms > 3000 ? " (کند — سرور در حال بیدار شدن)" : ""}`
          : `کد خطا ${r.status}`,
      });
    } catch {
      put({
        key: "ping",
        label: "دسترسی به سرور",
        state: "fail",
        detail: "سرور در دسترس نیست. اگر با وای‌فای کار می‌کند اما با اینترنت موبایل نه، اپراتور شما دسترسی به سرور را محدود کرده است.",
      });
    }

    // ۵) دیتابیس
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 25000);
      const r = await fetch(`/api/health?t=${Date.now()}`, { cache: "no-store", signal: ctrl.signal });
      clearTimeout(to);
      const d = await r.json().catch(() => ({}));
      put({
        key: "db",
        label: "پایگاه داده",
        state: d?.ok ? "ok" : "fail",
        detail: d?.ok ? "اتصال برقرار است" : d?.reason ?? "در دسترس نیست",
      });
    } catch {
      put({ key: "db", label: "پایگاه داده", state: "fail", detail: "پاسخ نداد (Timeout)" });
    }

    // ۶) نشست
    const cached = getCachedUser();
    put({
      key: "session",
      label: "نشست ذخیره‌شده (ورود آفلاین)",
      state: cached ? "ok" : "warn",
      detail: cached
        ? `${cached.fullName} — می‌توانید بدون اینترنت وارد شوید`
        : "هنوز نشستی ذخیره نشده؛ یک بار با اینترنت وارد شوید",
    });

    // ۷) شناسه دستگاه
    const id = getDeviceId();
    put({
      key: "device",
      label: "شناسه دستگاه (قفل سیم‌کارت)",
      state: id ? "ok" : "fail",
      detail: id ? `${getDeviceInfo()} | شناسه: ${id.slice(0, 10)}…` : "حافظه مرورگر مسدود است",
    });

    // ۸) موقعیت‌یاب
    put({
      key: "geo",
      label: "موقعیت‌یاب (GPS)",
      state: "geolocation" in navigator ? (window.isSecureContext ? "ok" : "warn") : "fail",
      detail:
        "geolocation" in navigator
          ? window.isSecureContext
            ? "در دسترس است"
            : "روی http کار نمی‌کند؛ آدرس باید https باشد"
          : "مرورگر پشتیبانی نمی‌کند",
    });

    // ۹) وضعیت سیم‌کارت
    put({
      key: "sim",
      label: "وضعیت سیم‌کارت / شبکه",
      state: sim.ok ? "ok" : "warn",
      detail: sim.ok ? `نوع اتصال: ${sim.type}` : sim.detail,
    });

    // ۱۰) توکن
    put({
      key: "token",
      label: "توکن ورود",
      state: getToken() ? "ok" : "warn",
      detail: getToken() ? "موجود است" : "وارد نشده‌اید",
    });

    setBusy(false);
  }, []);

  useEffect(() => {
    run();
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "queue-status") setQueue(e.data.pending);
      if (e.data?.type === "cache-status") setCacheInfo(`${e.data.cached} از ${e.data.expected} فایل`);
    };
    navigator.serviceWorker?.addEventListener("message", onMsg);
    navigator.serviceWorker?.controller?.postMessage("queue-count");
    navigator.serviceWorker?.controller?.postMessage("cache-status");
    return () => navigator.serviceWorker?.removeEventListener("message", onMsg);
  }, [run]);

  const icon = (s: Row["state"]) => (s === "ok" ? "✅" : s === "warn" ? "⚠️" : s === "run" ? "⏳" : "❌");
  const tone = (s: Row["state"]) =>
    s === "ok" ? "bg-emerald-50 ring-emerald-200" : s === "warn" ? "bg-amber-50 ring-amber-200" : "bg-rose-50 ring-rose-200";

  const fails = rows.filter((r) => r.state === "fail").length;

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle icon="🩺">عیب‌یابی اتصال و آفلاین</SectionTitle>
        <div className="flex gap-2">
          <Button onClick={run} disabled={busy}>
            {busy ? "⏳ در حال بررسی..." : "🔄 بررسی مجدد"}
          </Button>
          <Link href="/" className="rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-slate-700 ring-1 ring-slate-300">
            بازگشت
          </Link>
        </div>
      </div>

      {fails > 0 ? (
        <Alert kind="error">
          {toPersianDigits(fails)} مورد مشکل دارد. توضیح هر مورد را در فهرست پایین ببینید.
        </Alert>
      ) : rows.length > 0 && !busy ? (
        <Alert kind="success">✅ همه‌چیز سالم است — برنامه روی این دستگاه و این اینترنت درست کار می‌کند.</Alert>
      ) : null}

      <Card>
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.key} className={`rounded-xl px-3 py-2 ring-1 ${tone(r.state)}`}>
              <div className="flex items-start gap-2">
                <span>{icon(r.state)}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-slate-800">{r.label}</div>
                  <div className="mt-0.5 text-[11px] leading-5 text-slate-600">{r.detail}</div>
                </div>
              </div>
            </div>
          ))}
          {rows.length === 0 ? <p className="py-6 text-center text-xs text-slate-400">در حال بررسی...</p> : null}
        </div>
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">🛠 ابزارها</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="soft"
            onClick={() => {
              navigator.serviceWorker?.controller?.postMessage("flush");
              setTimeout(run, 1500);
            }}
          >
            📤 ارسال فوری صف آفلاین {queue ? `(${toPersianDigits(queue)})` : ""}
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              const regs = await navigator.serviceWorker.getRegistrations();
              await Promise.all(regs.map((r) => r.unregister()));
              const keys = await caches.keys();
              await Promise.all(keys.map((k) => caches.delete(k)));
              location.reload();
            }}
          >
            🧹 پاک‌سازی و نصب مجدد آفلاین
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              const text = rows.map((r) => `${icon(r.state)} ${r.label}: ${r.detail}`).join("\n");
              navigator.clipboard?.writeText(`گزارش عیب‌یابی\n${text}\n${navigator.userAgent}`);
            }}
          >
            📋 کپی گزارش
          </Button>
        </div>
        {cacheInfo ? <p className="mt-2 text-[11px] text-slate-400">حافظه آفلاین: {cacheInfo}</p> : null}
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">📖 راهنمای رفع مشکل</h3>
        <ul className="space-y-2 text-[11px] leading-6 text-slate-600">
          <li className="rounded-lg bg-slate-50 px-3 py-2">
            <b>اگر «دسترسی به سرور» فقط با وای‌فای کار می‌کند:</b> اپراتور موبایل شما دسترسی به سرور خارجی را محدود
            کرده است. راه‌حل: یک بار با وای‌فای برنامه را باز کنید تا کامل ذخیره شود؛ پس از آن با اینترنت موبایل هم
            باز می‌شود و اطلاعات در صف می‌ماند تا به وای‌فای وصل شوید. راه‌حل دائمی: انتقال برنامه به سرور داخل ایران.
          </li>
          <li className="rounded-lg bg-slate-50 px-3 py-2">
            <b>اگر «فایل‌های ذخیره‌شده» کم است:</b> یک بار با اینترنت پایدار همه صفحات را باز کنید یا دکمه
            «پاک‌سازی و نصب مجدد» را بزنید.
          </li>
          <li className="rounded-lg bg-slate-50 px-3 py-2">
            <b>برای بهترین نتیجه:</b> برنامه را از صفحه «نصب اپ» روی گوشی نصب کنید تا مستقل از مرورگر اجرا شود.
          </li>
        </ul>
      </Card>
    </main>
  );
}
