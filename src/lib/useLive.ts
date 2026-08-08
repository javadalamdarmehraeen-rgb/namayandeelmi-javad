"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * بروزرسانی لحظه‌ای هوشمند:
 *  - در حالت آنلاین هر `interval` میلی‌ثانیه داده را تازه می‌کند
 *  - وقتی تب مخفی است، پولینگ متوقف می‌شود (مصرف کمتر باتری و دیتا)
 *  - با بازگشت به تب یا وصل شدن اینترنت، فوراً یک بار تازه‌سازی می‌کند
 *  - روی اینترنت ضعیف (2G / save-data) فاصله را خودکار بیشتر می‌کند
 */
export function useLive(fn: () => void | Promise<void>, interval = 15000, enabled = true) {
  const saved = useRef(fn);
  saved.current = fn;
  const [paused, setPaused] = useState(false);

  const run = useCallback(() => {
    void saved.current();
  }, []);

  useEffect(() => {
    if (!enabled || paused) return;

    type Conn = { effectiveType?: string; saveData?: boolean };
    const conn = (navigator as Navigator & { connection?: Conn }).connection;
    const slow = conn?.saveData || ["slow-2g", "2g"].includes(conn?.effectiveType ?? "");
    const ms = slow ? Math.max(interval * 3, 45000) : interval;

    run();
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        if (!document.hidden && navigator.onLine) run();
      }, ms);
    };
    const onVisible = () => {
      if (!document.hidden) {
        run();
        start();
      } else if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    start();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", run);
    window.addEventListener("focus", run);
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", run);
      window.removeEventListener("focus", run);
    };
  }, [enabled, paused, interval, run]);

  return { refresh: run, paused, setPaused };
}
