"use client";
import { useEffect, useState } from "react";

import { createPortal } from "react-dom";
type App = {
  key: string;
  label: string;
  icon: string;
  /**      */
  scheme?: (lat: number, lng: number, name: string) => string;
  /**     */
  web: (lat: number, lng: number, name: string) => string;
  platforms?: ("android" | "ios" | "desktop")[];
};
const APPS: App[] = [
  {
    key: "neshan",
    label: "",
    icon: "",
    scheme: (la, ln) => `neshan://maps?lat=${la}&lng=${ln}`,
    web: (la, ln) => `https://neshan.org/maps/routing/car/${la},${ln}#c${la}-${ln}-16z-0p`,
    platforms: ["android", "ios", "desktop"],
  },
  {
    key: "balad",
    label: "",
    icon: "",
    scheme: (la, ln) => `balad://maps?lat=${la}&lng=${ln}`,
    web: (la, ln) => `https://balad.ir/navigate?destination=${la},${ln}`,
    platforms: ["android", "ios", "desktop"],
  },
  {
    key: "google",
    label: " ",
    icon: "",
    scheme: (la, ln) => `google.navigation:q=${la},${ln}&mode=d`,
    web: (la, ln) => `https://www.google.com/maps/dir/?api=1&destination=${la},${ln}&travelmode=driving`,
    platforms: ["android", "ios", "desktop"],
  },
  {
    key: "waze",
    label: " (Waze)",
    icon: "",
    scheme: (la, ln) => `waze://?ll=${la},${ln}&navigate=yes`,
    web: (la, ln) => `https://waze.com/ul?ll=${la},${ln}&navigate=yes`,
    platforms: ["android", "ios", "desktop"],
  },
  {
    key: "apple",
    label: " ",
    icon: "",
    scheme: (la, ln, n) => `maps://?daddr=${la},${ln}&q=${n}`,
    web: (la, ln, n) => `https://maps.apple.com/?daddr=${la},${ln}&q=${n}`,
    platforms: ["ios", "desktop"],
  },
  {
    key: "osm",
    label: "OpenStreetMap",
    icon: "",
    web: (la, ln) => `https://www.openstreetmap.org/directions?to=${la},${ln}`,
    platforms: ["android", "ios", "desktop"],
  },
  {
    key: "yandex",
    label: "",
    icon: "",
    scheme: (la, ln) => `yandexnavi://build_route_on_map?lat_to=${la}&lon_to=${ln}`,
    web: (la, ln) => `https://yandex.com/maps/?rtext=~${la},${ln}&rtt=auto`,
    platforms: ["android", "ios", "desktop"],
  },
  {
    key: "geo",
    label: "  ",
    icon: "",
    scheme: (la, ln, n) => `geo:${la},${ln}?q=${la},${ln}(${n})`,
    web: (la, ln) => `https://www.google.com/maps?q=${la},${ln}`,
    platforms: ["android"],
  },
];
function platform(): "android" | "ios" | "desktop" {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  return "desktop";
}

/**   —         */
export default function NavButton({
  lat,
  lng,
  label = "",
  compact = true,
}: {
  lat?: number | null;
  lng?: number | null;
  label?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [plat, setPlat] = useState<"android" | "ios" | "desktop">("desktop");
  const [canShare, setCanShare] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    setPlat(platform());
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
    const update = () => setMobileMenu(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  if (!lat || !lng) return <span className="text-[10px] text-slate-300">—</span>;
  const name = encodeURIComponent(label || "");
  const list = APPS.filter((a) => !a.platforms || a.platforms.includes(plat));
  const go = (a: App) => {
    setOpen(false);
    const webUrl = a.web(lat, lng, name);
    //       
    if (plat === "desktop" || !a.scheme) {
      const w = window.open(webUrl, "_blank", "noopener,noreferrer");
      if (!w) window.location.href = webUrl; //    
      return;
    }
    //              
    const started = Date.now();
    const fb = setTimeout(() => {
      if (!document.hidden && Date.now() - started < 2500) window.open(webUrl, "_blank", "noopener");
    }, 1100);
    window.addEventListener("pagehide", () => clearTimeout(fb), { once: true });
    window.location.href = a.scheme(lat, lng, name);
  };
  const shareLocation = async () => {
    setOpen(false);
    const text = `${label}\nhttps://www.google.com/maps?q=${lat},${lng}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: label, text });
        return;
      } catch {
        /*   */
      }
    }
    await navigator.clipboard?.writeText(text).catch(() => undefined);
  };
  const copyCoords = async () => {
    setOpen(false);
    await navigator.clipboard?.writeText(`${lat},${lng}`).catch(() => undefined);
  };
  const menu = open ? (
    <div
      className="fixed inset-0 z-[9998] bg-slate-900/45 backdrop-blur-[1px]"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }}
    >
      <div
        className={
          mobileMenu
            ? "fade-in fixed inset-x-3 bottom-3 max-h-[78vh] overflow-y-auto rounded-3xl bg-white p-3 shadow-2xl ring-1 

ring-white/80"
            : "fade-in fixed w-60 max-h-[75vh] overflow-y-auto rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-slate-200
"
        }
        style={mobileMenu ? undefined : { top: pos?.top ?? 80, left: pos?.left ?? 16 }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <div>
            <div className="text-xs font-black text-slate-800">  </div>
            <div className="mt-0.5 max-w-[190px] truncate text-[10px] text-slate-400">{label}</div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-60
0"
            aria-label=""
          >
            
          </button>
        </div>
        <div className={mobileMenu ? "grid grid-cols-2 gap-2" : "space-y-1"}>
          {list.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => go(a)}
              className={`flex items-center gap-2 rounded-xl bg-slate-50 px-3 text-right font-bold text-slate-700 ring-1
 ring-slate-200 transition hover:bg-teal-50 hover:text-teal-800 ${
                mobileMenu ? "min-h-12 py-3 text-xs" : "w-full py-2 text-[11px]"
              }`}
            >
              <span className="text-lg">{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
        <div className="my-2 h-px bg-slate-100" />
        <div className={mobileMenu ? "grid grid-cols-2 gap-2" : "space-y-1"}>
          {canShare ? (
            <button
              type="button"
              onClick={shareLocation}
              className="rounded-xl bg-sky-50 px-3 py-2.5 text-right text-[11px] font-bold text-sky-700 ring-1 ring-sky-
200"
            >
               
            </button>
          ) : null}
          <button
            type="button"
            onClick={copyCoords}
            className="rounded-xl bg-slate-100 px-3 py-2.5 text-right text-[11px] font-bold text-slate-700 ring-1 ring-s
late-200"
          >
              
          </button>
        </div>
      </div>
    </div>
  ) : null;
  return (
    <>
      <span className="relative inline-block">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const menuWidth = 240;
            const left = Math.min(Math.max(8, r.left), Math.max(8, window.innerWidth - menuWidth - 8));
            const estimatedHeight = 390;
            const top =
              r.bottom + estimatedHeight < window.innerHeight
                ? r.bottom + 6
                : Math.max(8, r.top - estimatedHeight - 6);
            setPos({ top, left });

            setOpen(true);
          }}
          title=" "
          className={`rounded-xl bg-gradient-to-l from-teal-600 to-emerald-600 font-bold text-white shadow-sm transition
 hover:from-teal-700 hover:to-emerald-700 active:scale-95 ${
            compact ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-2.5 text-xs"
          }`}
        >
           
        </button>
      </span>
      {mounted && menu ? createPortal(menu, document.body) : null}
    </>
  );
}
