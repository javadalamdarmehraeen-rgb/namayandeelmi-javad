"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type App = {
  key: string;
  label: string;
  subtitle: string;
  icon: string;
  scheme?: (lat: number, lng: number, name: string) => string;
  web: (lat: number, lng: number, name: string) => string;
  platforms?: ("android" | "ios" | "desktop")[];
};

const APPS: App[] = [
  {
    key: "neshan",
    label: "نشان",
    subtitle: "مسیریاب ایرانی",
    icon: "🧭",
    scheme: (la, ln) => `neshan://maps?lat=${la}&lng=${ln}`,
    web: (la, ln) => `https://neshan.org/maps/routing/car/${la},${ln}#c${la}-${ln}-16z-0p`,
    platforms: ["android", "ios", "desktop"],
  },
  {
    key: "balad",
    label: "بلد",
    subtitle: "نقشه و مسیریاب ایرانی",
    icon: "🗺️",
    scheme: (la, ln) => `balad://maps?lat=${la}&lng=${ln}`,
    web: (la, ln) => `https://balad.ir/navigate?destination=${la},${ln}`,
    platforms: ["android", "ios", "desktop"],
  },
  {
    key: "google",
    label: "Google Maps",
    subtitle: "گوگل مپ",
    icon: "🟢",
    scheme: (la, ln) => `google.navigation:q=${la},${ln}&mode=d`,
    web: (la, ln) => `https://www.google.com/maps/dir/?api=1&destination=${la},${ln}&travelmode=driving`,
    platforms: ["android", "ios", "desktop"],
  },
  {
    key: "waze",
    label: "Waze",
    subtitle: "مسیریابی خودرو",
    icon: "🚗",
    scheme: (la, ln) => `waze://?ll=${la},${ln}&navigate=yes`,
    web: (la, ln) => `https://waze.com/ul?ll=${la},${ln}&navigate=yes`,
    platforms: ["android", "ios", "desktop"],
  },
  {
    key: "apple",
    label: "Apple Maps",
    subtitle: "نقشه اپل",
    icon: "🍎",
    scheme: (la, ln, n) => `maps://?daddr=${la},${ln}&q=${n}`,
    web: (la, ln, n) => `https://maps.apple.com/?daddr=${la},${ln}&q=${n}`,
    platforms: ["ios", "desktop"],
  },
  {
    key: "yandex",
    label: "Yandex Navi",
    subtitle: "یاندکس",
    icon: "🟡",
    scheme: (la, ln) => `yandexnavi://build_route_on_map?lat_to=${la}&lon_to=${ln}`,
    web: (la, ln) => `https://yandex.com/maps/?rtext=~${la},${ln}&rtt=auto`,
    platforms: ["android", "ios", "desktop"],
  },
  {
    key: "osm",
    label: "OpenStreetMap",
    subtitle: "نقشه آزاد",
    icon: "🌍",
    web: (la, ln) => `https://www.openstreetmap.org/directions?to=${la},${ln}`,
    platforms: ["android", "ios", "desktop"],
  },
  {
    key: "geo",
    label: "مسیریاب پیش‌فرض گوشی",
    subtitle: "انتخاب توسط سیستم‌عامل",
    icon: "📱",
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

/** پنجره مسیریاب تمام‌عرض و مناسب موبایل */
export default function NavButton({
  lat,
  lng,
  label = "مقصد",
  compact = true,
}: {
  lat?: number | null;
  lng?: number | null;
  label?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [plat, setPlat] = useState<"android" | "ios" | "desktop">("desktop");
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPlat(platform());
    setCanShare(!!navigator.share);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
    };
  }, [open]);

  if (!lat || !lng) return <span className="text-[10px] text-slate-300">—</span>;

  const encodedName = encodeURIComponent(label || "مقصد");
  const list = APPS.filter((a) => !a.platforms || a.platforms.includes(plat));
  const locationText = `${label}\nhttps://www.google.com/maps?q=${lat},${lng}`;

  const go = (a: App) => {
    setOpen(false);
    const webUrl = a.web(lat, lng, encodedName);
    if (plat === "desktop" || !a.scheme) {
      const win = window.open(webUrl, "_blank", "noopener,noreferrer");
      if (!win) window.location.href = webUrl;
      return;
    }

    // ابتدا اپ نصب‌شده امتحان می‌شود؛ اگر باز نشد نسخه وب نمایش داده می‌شود
    const started = Date.now();
    const fallback = setTimeout(() => {
      if (!document.hidden && Date.now() - started < 2600) window.location.assign(webUrl);
    }, 1300);
    const onHide = () => clearTimeout(fallback);
    document.addEventListener("visibilitychange", onHide, { once: true });
    window.location.href = a.scheme(lat, lng, encodedName);
  };

  const shareLocation = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: label, text: locationText, url: `https://www.google.com/maps?q=${lat},${lng}` });
      setOpen(false);
    } catch {
      /* کاربر لغو کرد */
    }
  };

  const copyCoords = async () => {
    await navigator.clipboard?.writeText(`${lat},${lng}`).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const modal = open && mounted ? (
    <div
      className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={(e) => {
        e.stopPropagation();
        setOpen(false);
      }}
    >
      <div
        className="nav-sheet fade-in max-h-[88dvh] w-full overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-slate-300 sm:hidden" />
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h3 className="text-sm font-black text-slate-800">انتخاب مسیریاب</h3>
            <p className="mt-0.5 max-w-[16rem] truncate text-[11px] text-slate-500">مقصد: {label}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[calc(88dvh-8rem)] overflow-y-auto overscroll-contain p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
            {list.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => go(a)}
                className="flex min-h-16 items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2.5 text-right ring-1 ring-slate-200 transition active:scale-[.98] hover:bg-teal-50 hover:ring-teal-200"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                  {a.icon}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-black text-slate-800">{a.label}</span>
                  <span className="block truncate text-[9px] text-slate-500">{a.subtitle}</span>
                </span>
              </button>
            ))}
          </div>

          {canShare ? (
            <button
              type="button"
              onClick={shareLocation}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-50 px-3 py-3 text-xs font-black text-sky-700 ring-1 ring-sky-200"
            >
              📤 نمایش همه برنامه‌های نصب‌شده روی گوشی
            </button>
          ) : null}

          <button
            type="button"
            onClick={copyCoords}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-3 py-3 text-xs font-bold text-slate-700"
          >
            {copied ? "✅ مختصات کپی شد" : "📋 کپی مختصات مقصد"}
          </button>
          <p className="mt-2 text-center text-[9px] text-slate-400" dir="ltr">
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </p>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        title="انتخاب مسیریاب"
        className={`inline-flex items-center justify-center gap-1 rounded-xl bg-gradient-to-l from-teal-700 to-teal-500 font-bold text-white shadow-sm transition active:scale-[.97] hover:shadow-md ${
          compact ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-2.5 text-xs"
        }`}
      >
        🧭 مسیریابی
      </button>
      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
