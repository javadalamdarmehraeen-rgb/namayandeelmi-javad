"use client";
import { useCallback, useEffect, useRef, useState } from "react";
/**
 *  JSON    —  throw .
 *        .
 */
export async function fetchJson<T = unknown>(url: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, { cache: "no-store", ...init });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}
/**     API  `{ rows: [...] }`  */
export async function fetchRows<T = Record<string, unknown>>(url: string): Promise<T[]> {
  const d = await fetchJson<{ rows?: T[] }>(url, {});
  return Array.isArray(d.rows) ? d.rows : [];
}
/**
 *   :
 *  -     `interval`     
 *  -        (    )
 *  -             
 *  -    (2G / save-data)     
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
