"use client";

import { useEffect, useState } from "react";

/** ثبت سرویس‌ورکر + نوار وضعیت شبکه + همگام‌سازی خودکار صف آفلاین */
export default function ServiceWorker() {
  const [offline, setOffline] = useState(false);
  const [flash, setFlash] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const setState = () => setOffline(!navigator.onLine);
    setState();
    window.addEventListener("online", setState);
    window.addEventListener("offline", setState);

    let reg: ServiceWorkerRegistration | undefined;
    if ("serviceWorker" in navigator) {
      const t = setTimeout(() => {
        navigator.serviceWorker
          .register("/sw.js", { updateViaCache: "none" })
          .then((r) => {
            reg = r;
            r.update().catch(() => undefined);
          })
          .catch(() => undefined);
      }, 1200);

      navigator.serviceWorker.addEventListener("message", (e: MessageEvent) => {
        if (e.data?.type === "queue-flushed" && e.data.count > 0) {
          setFlash(`✅ ${e.data.count} مورد ذخیره‌شده آفلاین با موفقیت ارسال شد`);
          setTimeout(() => setFlash(""), 6000);
        }
      });

      const flush = () => navigator.serviceWorker.controller?.postMessage("flush");
      window.addEventListener("online", flush);
      const iv = setInterval(() => {
        if (navigator.onLine) flush();
      }, 30000);

      return () => {
        clearTimeout(t);
        clearInterval(iv);
        window.removeEventListener("online", setState);
        window.removeEventListener("offline", setState);
        window.removeEventListener("online", flush);
        void reg;
      };
    }
    return () => {
      window.removeEventListener("online", setState);
      window.removeEventListener("offline", setState);
    };
  }, []);

  return (
    <>
      {offline ? (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-amber-500 px-3 py-2 text-center text-xs font-bold text-white">
          📴 اینترنت قطع است — برنامه در حالت آفلاین کار می‌کند و اطلاعات پس از اتصال خودکار ارسال می‌شود
        </div>
      ) : null}
      {flash ? (
        <div className="fixed bottom-3 left-3 right-3 z-50 mx-auto max-w-sm rounded-xl bg-emerald-600 px-3 py-2 text-center text-xs font-bold text-white shadow-lg">
          {flash}
        </div>
      ) : null}
    </>
  );
}
