"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * نوار وضعیت اتصال + مدیریت صف ارسال آفلاین.
 *
 * رفتار:
 *  - به‌جای «صفحه آفلاین بن‌بست»، فقط یک نوار پایین صفحه نشان داده می‌شود
 *    و کاربر می‌تواند به کار کردن ادامه دهد.
 *  - «آفلاین» تنها زمانی اعلام می‌شود که واقعاً به سرور نرسیم
 *    (نه صرفاً navigator.onLine که روی اینترنت ایران گمراه‌کننده است).
 *  - وقتی اینترنت برگردد، کاربر دکمه «ارسال اطلاعات ذخیره‌شده» را می‌بیند
 *    و می‌تواند دستی ارسال کند؛ ارسال خودکار هم انجام می‌شود.
 */

type State = "online" | "checking" | "offline";

const PROBE_URL = "/ping";
const CHECK_INTERVAL = 25_000;

export default function ConnectionStatus() {
  const [state, setState] = useState<State>("online");
  const [pending, setPending] = useState(0);
  const [flash, setFlash] = useState("");
  const [sending, setSending] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const failures = useRef(0);

  /** آیا سرور واقعاً در دسترس است؟ (بدون تماس با دیتابیس) */
  const probe = useCallback(async (): Promise<boolean> => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return false;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(`${PROBE_URL}?t=${Date.now()}`, {
        cache: "no-store",
        signal: ctrl.signal,
        credentials: "omit",
      });
      clearTimeout(timer);
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const check = useCallback(async () => {
    const ok = await probe();
    if (ok) {
      failures.current = 0;
      setState("online");
      setDismissed(false);
      // با بازگشت اینترنت، صف خودکار ارسال می‌شود
      navigator.serviceWorker?.controller?.postMessage("flush");
    } else {
      failures.current += 1;
      // دو شکست پیاپی تا از هشدار الکی روی شبکه پرنوسان جلوگیری شود
      setState(failures.current >= 2 ? "offline" : "checking");
    }
    navigator.serviceWorker?.controller?.postMessage("queue-count");
  }, [probe]);

  useEffect(() => {
    check();
    const iv = setInterval(() => {
      if (!document.hidden) check();
    }, CHECK_INTERVAL);

    const onOnline = () => check();
    const onFocus = () => check();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", () => setState("offline"));
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "queue-status") {
        setPending(e.data.pending ?? 0);
        if (e.data.sent > 0) {
          setFlash(`✅ ${e.data.sent} مورد ذخیره‌شده با موفقیت ارسال شد`);
          setTimeout(() => setFlash(""), 6000);
        }
      }
      if (e.data?.type === "queued") {
        setPending((p) => p + 1);
        setFlash("📥 اطلاعات ذخیره شد و پس از وصل شدن اینترنت ارسال می‌شود");
        setTimeout(() => setFlash(""), 6000);
      }
    };
    navigator.serviceWorker?.addEventListener("message", onMsg);

    return () => {
      clearInterval(iv);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      navigator.serviceWorker?.removeEventListener("message", onMsg);
    };
  }, [check]);

  const sendNow = async () => {
    setSending(true);
    setFlash("⏳ در حال ارسال اطلاعات ذخیره‌شده...");
    const ok = await probe();
    if (!ok) {
      setSending(false);
      setFlash("⛔ هنوز ارتباط با سرور برقرار نیست. کمی بعد دوباره تلاش کنید.");
      setTimeout(() => setFlash(""), 6000);
      return;
    }
    navigator.serviceWorker?.controller?.postMessage("flush");
    setTimeout(() => {
      navigator.serviceWorker?.controller?.postMessage("queue-count");
      setSending(false);
    }, 2500);
  };

  const offline = state === "offline";
  const showBar = (offline && !dismissed) || pending > 0 || !!flash;
  if (!showBar) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex flex-col items-center gap-2 p-3">
      {flash ? (
        <div className="pointer-events-auto w-full max-w-md rounded-xl bg-slate-900/95 px-3 py-2 text-center text-xs font-bold text-white shadow-lg">
          {flash}
        </div>
      ) : null}

      {offline && !dismissed ? (
        <div className="pointer-events-auto w-full max-w-md rounded-2xl bg-amber-500 px-3 py-2.5 text-white shadow-xl">
          <div className="flex items-start gap-2">
            <span className="text-lg">📡</span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black">ارتباط با سرور برقرار نیست</div>
              <div className="mt-0.5 text-[11px] leading-5 text-amber-50">
                لطفاً اتصال اینترنت خود را بررسی کنید. می‌توانید به کار ادامه دهید؛ اطلاعات ذخیره می‌شود و پس از
                وصل شدن ارسال خواهد شد.
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={check}
                  className="rounded-lg bg-white px-3 py-1 text-[11px] font-bold text-amber-700"
                >
                  🔄 بررسی مجدد
                </button>
                <a
                  href="/diagnostics"
                  className="rounded-lg bg-white/20 px-3 py-1 text-[11px] font-bold text-white ring-1 ring-white/40"
                >
                  🩺 عیب‌یابی
                </a>
                <button
                  onClick={() => setDismissed(true)}
                  className="rounded-lg bg-white/20 px-3 py-1 text-[11px] font-bold text-white ring-1 ring-white/40"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {pending > 0 ? (
        <div className="pointer-events-auto w-full max-w-md rounded-2xl bg-teal-700 px-3 py-2.5 text-white shadow-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg">📤</span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black">
                {pending.toLocaleString("fa-IR")} مورد در انتظار ارسال
              </div>
              <div className="text-[11px] text-teal-50">
                {offline ? "به‌محض وصل شدن اینترنت ارسال می‌شود" : "اینترنت وصل است — می‌توانید همین حالا ارسال کنید"}
              </div>
            </div>
            <button
              onClick={sendNow}
              disabled={sending}
              className="rounded-lg bg-white px-3 py-1.5 text-[11px] font-black text-teal-800 disabled:opacity-60"
            >
              {sending ? "در حال ارسال..." : "ارسال اکنون"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
