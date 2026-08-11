"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { tehranDateTime, toPersianDigits } from "@/lib/jalali";
import { playNotificationSound, vibrate } from "@/lib/sound";
type N = {
  id: number;
  title: string;
  body: string;
  fromName: string;
  kind: string;
  link: string;
  readAt: string | null;
  createdAt: string;
};
export default function NotificationBell({ basePath }: { basePath: string }) {
  const [rows, setRows] = useState<N[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<N | null>(null);
  const [muted, setMuted] = useState(false);
  const lastId = useRef<number>(0);
  const initialized = useRef(false);
  const load = useCallback(async () => {
    //        
    const res = await fetch("/api/notifications?unread=1", { cache: "no-store" }).catch(() => null);
    if (!res?.ok) return;
    const d = await res.json();
    const list: N[] = d.rows ?? [];
    setRows(list);
    setUnread(list.length);
    const top = list[0];
    if (top && initialized.current && top.id > lastId.current && !top.readAt) {
      setToast(top);
      setTimeout(() => setToast(null), 10000);
      if (localStorage.getItem("sek_mute") !== "1") {
        playNotificationSound();
        vibrate();
      }
      showSystemNotification(top);
    }
    if (top) lastId.current = Math.max(lastId.current, top.id);
    initialized.current = true;
  }, []);
  useEffect(() => {
    setMuted(localStorage.getItem("sek_mute") === "1");
    load();
    const t = setInterval(load, 20000);
    //        ( )
    const ask = () => {
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        Notification.requestPermission().catch(() => undefined);
      }
      window.removeEventListener("click", ask);
      window.removeEventListener("touchstart", ask);
    };
    window.addEventListener("click", ask, { once: true });
    window.addEventListener("touchstart", ask, { once: true });
    //       
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "notification-click") {

        if (e.data.id) markOne(Number(e.data.id));
        load();
      }
    };
    navigator.serviceWorker?.addEventListener("message", onMsg);
    return () => {
      clearInterval(t);
      window.removeEventListener("click", ask);
      window.removeEventListener("touchstart", ask);
      navigator.serviceWorker?.removeEventListener("message", onMsg);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);
  /**    —        */
  const showSystemNotification = async (n: N) => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const payload = {
      body: n.body || n.title,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: `sek-${n.id}`,
      dir: "rtl" as const,
      lang: "fa",
      requireInteraction: true,
      data: { id: n.id, link: n.link || `${basePath}/notifications` },
      vibrate: [200, 100, 200],
    };
    try {
      //           
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) {
        await reg.showNotification(` ${n.title}`, payload as NotificationOptions);
        return;
      }
      const note = new Notification(` ${n.title}`, payload as NotificationOptions);
      note.onclick = () => {
        window.focus();
        markOne(n.id);
        window.location.href = payload.data.link;
        note.close();
      };
    } catch {
      /* ignore */
    }
  };
  const markOne = async (id: number) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    load();
  };
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    localStorage.setItem("sek_mute", next ? "1" : "0");
    if (!next) playNotificationSound();
  };
  const askPermission = async () => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission().catch(() => undefined);
    }
  };
  const markAll = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    load();
  };
  return (
    <>
      <div className="relative">
        <button
          onClick={() => {
            setOpen((v) => !v);

            askPermission();
          }}
          className="relative rounded-lg bg-white/15 px-2 py-1.5 text-sm hover:bg-white/25"
          title=""
        >
          
          {unread > 0 ? (
            <span className="absolute -top-1 -left-1 rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white">
              {toPersianDigits(unread > 99 ? "99+" : unread)}
            </span>
          ) : null}
        </button>
        {open ? (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <div className="fade-in absolute left-0 z-40 mt-2 max-h-80 w-72 overflow-y-auto rounded-2xl bg-white p-2 tex
t-slate-800 shadow-2xl ring-1 ring-slate-200">
              <div className="mb-1 flex items-center justify-between px-2">
                <span className="text-xs font-bold text-slate-600"></span>
                <div className="flex items-center gap-2">
                  <button onClick={toggleMute} className="text-[11px] font-bold text-slate-500" title=" ">
                    {muted ? "  " : "  "}
                  </button>
                  <button onClick={markAll} className="text-[11px] font-bold text-teal-700">
                     
                  </button>
                </div>
              </div>
              {rows.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-slate-400">
                     
                </p>
              ) : (
                rows.slice(0, 12).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.readAt && markOne(n.id)}
                    className={`mb-1 cursor-pointer rounded-xl px-2.5 py-2 text-xs ${n.readAt ? "bg-slate-50" : "bg-teal
-50 ring-1 ring-teal-200"}`}
                  >
                    <div className="font-bold text-slate-800">
                      {n.title}
                      {!n.readAt ? <span className="mr-1 text-[9px] text-teal-600">(   )</span> : null
}
                    </div>
                    {n.body ? <div className="mt-0.5 text-[11px] text-slate-600">{n.body}</div> : null}
                    <div className="mt-1 text-[10px] text-slate-400">
                      {n.fromName ? `${n.fromName} — ` : ""}
                      {tehranDateTime(n.createdAt)}
                    </div>
                  </div>
                ))
              )}
              <Link
                href={`${basePath}/notifications`}
                onClick={() => setOpen(false)}
                className="block rounded-xl bg-slate-100 py-2 text-center text-xs font-bold text-slate-700"
              >
                  
              </Link>
            </div>
          </>
        ) : null}
      </div>
      {toast ? (
        <div className="fade-in fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl bg-slate-900/95 p-3 text
-white shadow-2xl sm:right-auto">
          <div className="text-xs font-black text-amber-300">  </div>
          <div className="mt-1 text-sm font-bold">{toast.title}</div>
          {toast.body ? <div className="text-xs text-slate-200">{toast.body}</div> : null}
          <div className="mt-2 flex gap-3">
            <button
              onClick={() => {
                markOne(toast.id);
                setToast(null);
              }}
              className="text-[11px] font-bold text-emerald-300"
            >
               
            </button>
            <button onClick={() => setToast(null)} className="text-[11px] font-bold text-teal-300">
              
            </button>

          </div>
        </div>
      ) : null}
    </>
  );
}
