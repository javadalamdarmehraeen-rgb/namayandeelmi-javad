"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type App = {
  key: string;
  label: string;
  icon: string;
  scheme?: (lat: number, lng: number, name: string) => string;
  web: (lat: number, lng: number, name: string) => string;
  platforms?: ("android" | "ios" | "desktop")[];
};

const APPS: App[] = [
  { key: "neshan", label: "نشان", icon: "🧭", scheme: (a,b)=>`neshan://maps?lat=${a}&lng=${b}`, web:(a,b)=>`https://neshan.org/maps/routing/car/${a},${b}#c${a}-${b}-16z-0p` },
  { key: "balad", label: "بلد", icon: "🗺️", scheme:(a,b)=>`balad://maps?lat=${a}&lng=${b}`, web:(a,b)=>`https://balad.ir/navigate?destination=${a},${b}` },
  { key: "google", label: "گوگل مپ", icon: "🟢", scheme:(a,b)=>`google.navigation:q=${a},${b}&mode=d`, web:(a,b)=>`https://www.google.com/maps/dir/?api=1&destination=${a},${b}&travelmode=driving` },
  { key: "waze", label: "ویز (Waze)", icon: "🚗", scheme:(a,b)=>`waze://?ll=${a},${b}&navigate=yes`, web:(a,b)=>`https://waze.com/ul?ll=${a},${b}&navigate=yes` },
  { key: "apple", label: "نقشه اپل", icon: "🍎", scheme:(a,b,n)=>`maps://?daddr=${a},${b}&q=${n}`, web:(a,b,n)=>`https://maps.apple.com/?daddr=${a},${b}&q=${n}`, platforms:["ios","desktop"] },
  { key: "osm", label: "OpenStreetMap", icon: "🌍", web:(a,b)=>`https://www.openstreetmap.org/directions?to=${a},${b}` },
  { key: "yandex", label: "یاندکس", icon: "🟡", scheme:(a,b)=>`yandexnavi://build_route_on_map?lat_to=${a}&lon_to=${b}`, web:(a,b)=>`https://yandex.com/maps/?rtext=~${a},${b}&rtt=auto` },
  { key: "geo", label: "مسیریاب پیش‌فرض گوشی", icon: "📱", scheme:(a,b,n)=>`geo:${a},${b}?q=${a},${b}(${n})`, web:(a,b)=>`https://www.google.com/maps?q=${a},${b}`, platforms:["android"] },
];

function platform(): "android" | "ios" | "desktop" {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  return "desktop";
}

/** منوی مسیریاب واکنش‌گرا: Bottom Sheet در موبایل، پنجره مرکزی در دسکتاپ */
export default function NavButton({ lat, lng, label = "مقصد", compact = true }: {
  lat?: number | null; lng?: number | null; label?: string; compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [plat, setPlat] = useState<"android" | "ios" | "desktop">("desktop");
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPlat(platform());
    setCanShare(!!navigator.share);
  }, []);

  useEffect(() => {
    if (!open) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = old;
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (!lat || !lng) return <span className="text-[10px] text-slate-300">—</span>;

  const name = encodeURIComponent(label || "مقصد");
  const list = APPS.filter((a) => !a.platforms || a.platforms.includes(plat));

  const go = (a: App) => {
    setOpen(false);
    const web = a.web(lat, lng, name);
    if (plat === "desktop" || !a.scheme) {
      const w = window.open(web, "_blank", "noopener,noreferrer");
      if (!w) window.location.assign(web);
      return;
    }
    const timer = setTimeout(() => {
      if (!document.hidden) window.location.href = web;
    }, 1300);
    window.addEventListener("pagehide", () => clearTimeout(timer), { once: true });
    window.location.href = a.scheme(lat, lng, name);
  };

  const share = async () => {
    setOpen(false);
    const text = `${label}\nhttps://www.google.com/maps?q=${lat},${lng}`;
    if (navigator.share) {
      try { await navigator.share({ title: label, text }); return; } catch { /* لغو */ }
    }
    await navigator.clipboard?.writeText(text).catch(() => undefined);
  };

  const modal = open && mounted ? createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="انتخاب مسیریاب"
    >
      <div
        className="fade-in w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-slate-300 sm:hidden" />
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h3 className="text-sm font-black text-slate-800">🧭 انتخاب مسیریاب</h3>
            <p className="mt-0.5 max-w-[270px] truncate text-[11px] text-slate-500">مقصد: {label}</p>
          </div>
          <button onClick={() => setOpen(false)} className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600">✕</button>
        </div>

        <div className="max-h-[68vh] overflow-y-auto overscroll-contain p-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="grid grid-cols-2 gap-2">
            {list.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => go(a)}
                className="flex min-h-14 items-center gap-2 rounded-2xl bg-slate-50 px-3 py-3 text-right text-xs font-bold text-slate-700 ring-1 ring-slate-200 transition active:scale-95 active:bg-teal-50"
              >
                <span className="text-xl">{a.icon}</span>
                <span>{a.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {canShare ? (
              <button onClick={share} className="rounded-xl bg-sky-50 px-3 py-2.5 text-xs font-bold text-sky-700 ring-1 ring-sky-200">📤 اشتراک‌گذاری با اپ‌های دیگر</button>
            ) : null}
            <button
              onClick={async () => { setOpen(false); await navigator.clipboard?.writeText(`${lat},${lng}`).catch(()=>undefined); }}
              className="rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200"
            >📋 کپی مختصات</button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <span className="inline-block">
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className={`rounded-xl bg-teal-600 font-bold text-white shadow-sm transition hover:bg-teal-700 active:scale-95 ${compact ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-2.5 text-xs"}`}
      >🧭 مسیریابی</button>
      {modal}
    </span>
  );
}
