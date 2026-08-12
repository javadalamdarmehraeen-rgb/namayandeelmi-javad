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
    // )   
    const sim = readSimStatus();
    type Conn = { effectiveType?: string; type?: string; downlink?: number; rtt?: number; saveData?: boolean };
    const conn = (navigator as Navigator & { connection?: Conn }).connection;
    put({
      key: "net",
      label: "  ",
      state: navigator.onLine ? "ok" : "fail",
      detail: navigator.onLine
        ? `: ${conn?.type ?? ""} | : ${conn?.effectiveType ?? "?"} |  : ${conn?.downlink ?? "?"}
Mb | : ${conn?.rtt ?? "?"}ms${conn?.saveData ? " |   " : ""}`
        : "  ",
    });
    // ) 
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      put({
        key: "sw",
        label: " ( )",
        state: reg?.active ? "ok" : "warn",
        detail: reg?.active
          ? "  —      "
          : "        ",
      });
    } else {
      put({ key: "sw", label: "", state: "fail", detail: "  " });
    }
    // )  
    try {
      const names = await caches.keys();
      let total = 0;
      for (const n of names) {
        const c = await caches.open(n);
        total += (await c.keys()).length;
      }
      put({
        key: "cache",
        label: "  ",
        state: total > 30 ? "ok" : total > 0 ? "warn" : "fail",
        detail:
          total > 30
            ? `${toPersianDigits(total)}    —     `
            : ` ${toPersianDigits(total)}            `,
      });
      setCacheInfo(`${total}   ${names.length} `);
    } catch {
      put({ key: "cache", label: " ", state: "fail", detail: "    " });
    }
    // )   ( )
    const t0 = performance.now();

    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 20000);
      const r = await fetch(`/api/ping?t=${Date.now()}`, { cache: "no-store", signal: ctrl.signal });
      clearTimeout(to);
      const ms = Math.round(performance.now() - t0);
      put({
        key: "ping",
        label: "  ",
        state: r.ok ? (ms < 3000 ? "ok" : "warn") : "fail",
        detail: r.ok
          ? `  ${toPersianDigits(ms)} ${ms > 3000 ? " ( —     )" : ""}`
          : `  ${r.status}`,
      });
    } catch {
      put({
        key: "ping",
        label: "  ",
        state: "fail",
        detail: "   .                 
  .",
      });
    }
    // ) 
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 25000);
      const r = await fetch(`/api/health?t=${Date.now()}`, { cache: "no-store", signal: ctrl.signal });
      clearTimeout(to);
      const d = await r.json().catch(() => ({}));
      put({
        key: "db",
        label: " ",
        state: d?.ok ? "ok" : "fail",
        detail: d?.ok ? "  " : d?.reason ?? "  ",
      });
    } catch {
      put({ key: "db", label: " ", state: "fail", detail: "  (Timeout)" });
    }
    // ) 
    const cached = getCachedUser();
    put({
      key: "session",
      label: "  ( )",
      state: cached ? "ok" : "warn",
      detail: cached
        ? `${cached.fullName} —     `
        : "         ",
    });
    // )  
    const id = getDeviceId();
    put({
      key: "device",
      label: "  ( )",
      state: id ? "ok" : "fail",
      detail: id ? `${getDeviceInfo()} | : ${id.slice(0, 10)}…` : "   ",
    });
    // ) 
    put({
      key: "geo",
      label: " (GPS)",
      state: "geolocation" in navigator ? (window.isSecureContext ? "ok" : "warn") : "fail",
      detail:
        "geolocation" in navigator
          ? window.isSecureContext
            ? "  "
            : " http     https "
          : "  ",
    });
    // )  
    put({
      key: "sim",
      label: "  / ",
      state: sim.ok ? "ok" : "warn",
      detail: sim.ok ? ` : ${sim.type}` : sim.detail,
    });
    // ) 
    put({
      key: "token",

      label: " ",
      state: getToken() ? "ok" : "warn",
      detail: getToken() ? " " : " ",
    });
    setBusy(false);
  }, []);
  useEffect(() => {
    run();
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "queue-status") setQueue(e.data.pending);
      if (e.data?.type === "cache-status") setCacheInfo(`${e.data.cached}  ${e.data.expected} `);
    };
    navigator.serviceWorker?.addEventListener("message", onMsg);
    navigator.serviceWorker?.controller?.postMessage("queue-count");
    navigator.serviceWorker?.controller?.postMessage("cache-status");
    return () => navigator.serviceWorker?.removeEventListener("message", onMsg);
  }, [run]);
  const icon = (s: Row["state"]) => (s === "ok" ? "" : s === "warn" ? "" : s === "run" ? "" : "");
  const tone = (s: Row["state"]) =>
    s === "ok" ? "bg-emerald-50 ring-emerald-200" : s === "warn" ? "bg-amber-50 ring-amber-200" : "bg-rose-50 ring-rose-
200";
  const fails = rows.filter((r) => r.state === "fail").length;
  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle icon="">   </SectionTitle>
        <div className="flex gap-2">
          <Button onClick={run} disabled={busy}>
            {busy ? "   ..." : "  "}
          </Button>
          <Link href="/" className="rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-slate-700 ring-1 ring-slate-3
00">
            
          </Link>
        </div>
      </div>
      {fails > 0 ? (
        <Alert kind="error">
          {toPersianDigits(fails)}   .        .
        </Alert>
      ) : rows.length > 0 && !busy ? (
        <Alert kind="success">    —          .</Alert>
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
          {rows.length === 0 ? <p className="py-6 text-center text-xs text-slate-400">  ...</p> : null}
        </div>
      </Card>
      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700"> </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="soft"
            onClick={() => {
              navigator.serviceWorker?.controller?.postMessage("flush");
              setTimeout(run, 1500);
            }}
          >
                 {queue ? `(${toPersianDigits(queue)})` : ""}
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
                 
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              const text = rows.map((r) => `${icon(r.state)} ${r.label}: ${r.detail}`).join("\n");
              navigator.clipboard?.writeText(` \n${text}\n${navigator.userAgent}`);
            }}
          >
              
          </Button>
        </div>
        {cacheInfo ? <p className="mt-2 text-[11px] text-slate-400"> : {cacheInfo}</p> : null}
      </Card>
      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">   </h3>
        <ul className="space-y-2 text-[11px] leading-6 text-slate-600">
          <li className="rounded-lg bg-slate-50 px-3 py-2">
            <b> «  »     :</b>         
             . :                   
                       .  :      .
          </li>
          <li className="rounded-lg bg-slate-50 px-3 py-2">
            <b> « »  :</b>            
            «   »  .
          </li>
          <li className="rounded-lg bg-slate-50 px-3 py-2">
            <b>  :</b>     « »          .
          </li>
        </ul>
      </Card>
    </main>
  );
}
