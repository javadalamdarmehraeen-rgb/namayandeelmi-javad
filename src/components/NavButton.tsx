"use client";

import { useEffect, useState } from "react";

type App = {
  key: string;
  label: string;
  icon: string;
  /** اسکیم اپ نصب‌شده روی گوشی */
  scheme?: (lat: number, lng: number, name: string) => string;
  /** آدرس وب به‌عنوان جایگزین */
  web: (lat: number, lng: number, name: string) => string;
  platforms?: ("android" | "ios" | "desktop")[];
};

const APPS: App[] = [
  {
    key: "neshan",
    label: "نشان",
    icon: "🧭",
    scheme: (la, ln) => `neshan://maps?lat=${la}&lng=${ln}`,
    web: (la, ln) => `https://neshan.org/maps/routing/car/${la},${ln}#c${la}-${ln}-16z-0p`,
    platforms: ["android", "ios", "desktop"],
  },
  {
    key: "balad",
    label: "بلد",
    icon: "🗺️",
    scheme: (la, ln) => `balad://maps?lat=${la}&lng=${ln}`,
    web: (la, ln) => `https://balad.ir/navigate?destination=${la},${ln}`,
    platforms: ["android", "ios", "desktop"],
  },
  {
    key: "google",
    label: "گوگل مپ",
    icon: "🟢",
    scheme: (la, ln) => `google.navigation:q=${la},${ln}&mode=d`,
    web: (la, ln) => `https://www.google.com/maps/dir/?api=1&destination=${la},${ln}&travelmode=driving`,
    platforms: ["android", "ios", "desktop"],
  },
  {
    key: "waze",
    label: "ویز (Waze)",
    icon: "🚗",
    scheme: (la, ln) => `waze://?ll=${la},${ln}&navigate=yes`,
    web: (la, ln) => `https://waze.com/ul?ll=${la},${ln}&navigate=yes`,
    platforms: ["android", "ios", "desktop"],
  },
  {
    key: "apple",
    label: "نقشه اپل",
    icon: "🍎",
    scheme: (la, ln, n) => `maps://?daddr=${la},${ln}&q=${n}`,
    web: (la, ln, n) => `https://maps.apple.com/?daddr=${la},${ln}&q=${n}`,
    platforms: ["ios", "desktop"],
  },
  {
    key: "osm",
    label: "OpenStreetMap",
    icon: "🌍",
    web: (la, ln) => `https://www.openstreetmap.org/directions?to=${la},${ln}`,
    platforms: ["android", "ios", "desktop"],
  },
  {
    key: "yandex",
    label: "یاندکس",
    icon: "🟡",
    scheme: (la, ln) => `yandexnavi://build_route_on_map?lat_to=${la}&lon_to=${ln}`,
    web: (la, ln) => `https://yandex.com/maps/?rtext=~${la},${ln}&rtt=auto`,
    platforms: ["android", "ios", "desktop"],
  },
  {
    key: "geo",
    label: "مسیریاب پیش‌فرض دستگاه",
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

/** دکمه مسیریابی — همه مسیریاب‌های موجود روی دستگاه را فهرست می‌کند */
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
  const [plat, setPlat] = useState<"android" | "ios" | "desktop">("desktop");
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setPlat(platform());
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  if (!lat || !lng) return <span className="text-[10px] text-slate-300">—</span>;

  const name = encodeURIComponent(label || "مقصد");
  const list = APPS.filter((a) => !a.platforms || a.platforms.includes(plat));

  const go = (a: App) => {
    setOpen(false);
    const webUrl = a.web(lat, lng, name);
    // روی موبایل ابتدا اپ نصب‌شده امتحان می‌شود، در صورت نبود نسخه وب باز می‌شود
    if (a.scheme && plat !== "desktop") {
      const started = Date.now();
      const fb = setTimeout(() => {
        if (!document.hidden && Date.now() - started < 2500) window.open(webUrl, "_blank", "noopener");
      }, 1100);
      window.addEventListener("pagehide", () => clearTimeout(fb), { once: true });
      window.location.href = a.scheme(lat, lng, name);
      return;
    }
    window.open(webUrl, "_blank", "noopener");
  };

  const shareLocation = async () => {
    setOpen(false);
    const text = `${label}\nhttps://www.google.com/maps?q=${lat},${lng}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: label, text });
        return;
      } catch {
        /* لغو شد */
      }
    }
    await navigator.clipboard?.writeText(text).catch(() => undefined);
  };

  const copyCoords = async () => {
    setOpen(false);
    await navigator.clipboard?.writeText(`${lat},${lng}`).catch(() => undefined);
  };

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="انتخاب مسیریاب"
        className={`rounded-lg bg-teal-600 font-bold text-white hover:bg-teal-700 ${
          compact ? "px-2 py-1 text-[11px]" : "px-3 py-2 text-xs"
        }`}
      >
        🧭 مسیریابی
      </button>
      {open ? (
        <>
          <span className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <span className="fade-in absolute left-0 z-50 mt-1 block w-56 rounded-xl bg-white p-1 shadow-2xl ring-1 ring-slate-200">
            <span className="block px-2 py-1 text-[10px] font-bold text-slate-400">
              مسیریاب مورد نظر را انتخاب کنید
            </span>
            {list.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => go(a)}
                className="block w-full rounded-lg px-2 py-2 text-right text-[11px] font-bold text-slate-700 hover:bg-teal-50"
              >
                {a.icon} {a.label}
              </button>
            ))}
            <span className="my-1 block h-px bg-slate-100" />
            {canShare ? (
              <button
                type="button"
                onClick={shareLocation}
                className="block w-full rounded-lg px-2 py-2 text-right text-[11px] font-bold text-sky-700 hover:bg-sky-50"
              >
                📤 اشتراک‌گذاری با سایر اپ‌ها
              </button>
            ) : null}
            <button
              type="button"
              onClick={copyCoords}
              className="block w-full rounded-lg px-2 py-2 text-right text-[11px] font-bold text-slate-600 hover:bg-slate-50"
            >
              📋 کپی مختصات
            </button>
          </span>
        </>
      ) : null}
    </span>
  );
}
