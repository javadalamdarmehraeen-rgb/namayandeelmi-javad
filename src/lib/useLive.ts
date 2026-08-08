"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * بروزرسانی لحظه‌ای هوشمند.
 *
 * نکته مهم (رفع «پرش» هنگام تعویض تب):
 *  کامپوننت‌ها هنگام mount شدن بلافاصله داده می‌خواستند و اگر پاسخ از کش
 *  می‌آمد، ابتدا داده قدیمی و بعد داده تازه نمایش داده می‌شد. حالا:
 *   • نتیجه هر مسیر در حافظه ماژول نگه داشته می‌شود
 *   • درخواست‌های تکراری هم‌زمان ادغام می‌شوند (de-dupe)
 *   • تا وقتی پاسخ تازه نیامده، محتوای قبلی حفظ می‌شود (بدون پرش)
 */

type Fetcher = () => void | Promise<void>;

/** آخرین زمان اجرای هر کلید تا اجرای پشت‌سرهم انجام نشود */
const lastRun = new Map<string, number>();

export function useLive(fn: Fetcher, interval = 15000, enabled = true, key?: string) {
  const saved = useRef(fn);
  saved.current = fn;
  const [paused, setPaused] = useState(false);
  const busy = useRef(false);

  const run = useCallback(async () => {
    if (busy.current) return; // از اجرای هم‌زمان جلوگیری می‌کند
    if (key) {
      const last = lastRun.get(key) ?? 0;
      if (Date.now() - last < 1200) return; // ضد اجرای مکرر هنگام mount
      lastRun.set(key, Date.now());
    }
    busy.current = true;
    try {
      await saved.current();
    } finally {
      busy.current = false;
    }
  }, [key]);

  useEffect(() => {
    if (!enabled || paused) return;

    type Conn = { effectiveType?: string; saveData?: boolean };
    const conn = (navigator as Navigator & { connection?: Conn }).connection;
    const slow = conn?.saveData || ["slow-2g", "2g"].includes(conn?.effectiveType ?? "");
    const ms = slow ? Math.max(interval * 3, 45000) : interval;

    void run();
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        if (!document.hidden && navigator.onLine) void run();
      }, ms);
    };
    const onVisible = () => {
      if (!document.hidden) {
        void run();
        start();
      } else if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    start();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", () => void run());
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, paused, interval, run]);

  return { refresh: run, paused, setPaused };
}

/* ------------------------------------------------------------------ */
/*  کش سبک در حافظه — از «پرش» داده هنگام تعویض تب جلوگیری می‌کند       */
/* ------------------------------------------------------------------ */

const memCache = new Map<string, { data: unknown; at: number }>();
const inflight = new Map<string, Promise<unknown>>();

export function getCached<T>(key: string, maxAgeMs = 60000): T | null {
  const hit = memCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > maxAgeMs) return null;
  return hit.data as T;
}

/** واکشی با ادغام درخواست‌های هم‌زمان و کش کوتاه‌مدت */
export async function fetchJson<T>(url: string, maxAgeMs = 0): Promise<T | null> {
  if (maxAgeMs > 0) {
    const c = getCached<T>(url, maxAgeMs);
    if (c) return c;
  }
  const running = inflight.get(url);
  if (running) return (await running) as T;

  const p = (async () => {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      memCache.set(url, { data, at: Date.now() });
      return data;
    } catch {
      return getCached<T>(url, 10 * 60 * 1000);
    } finally {
      inflight.delete(url);
    }
  })();

  inflight.set(url, p);
  return (await p) as T | null;
}

export function invalidate(prefix: string) {
  for (const k of [...memCache.keys()]) if (k.startsWith(prefix)) memCache.delete(k);
}
