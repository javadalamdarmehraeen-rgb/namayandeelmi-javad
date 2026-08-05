"use client";

import { useState } from "react";

/** دکمه مسیریابی: باز کردن نقطه در نشان، بلد، ویز، گوگل‌مپ یا اپ پیش‌فرض گوشی */
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
  if (!lat || !lng) return <span className="text-[10px] text-slate-300">—</span>;

  const name = encodeURIComponent(label);
  const apps = [
    { key: "neshan", label: "نشان", icon: "🧭", url: `https://neshan.org/maps/@${lat},${lng},17z` },
    { key: "balad", label: "بلد", icon: "🗺️", url: `https://balad.ir/location?latitude=${lat}&longitude=${lng}&zoom=17` },
    { key: "waze", label: "ویز (Waze)", icon: "🚗", url: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes` },
    {
      key: "google",
      label: "گوگل مپ",
      icon: "🟢",
      url: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
    },
    { key: "geo", label: "اپ پیش‌فرض گوشی", icon: "📱", url: `geo:${lat},${lng}?q=${lat},${lng}(${name})` },
  ];

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="مسیریابی"
        className={`rounded-lg bg-teal-600 font-bold text-white hover:bg-teal-700 ${
          compact ? "px-2 py-1 text-[11px]" : "px-3 py-2 text-xs"
        }`}
      >
        🧭 مسیریابی
      </button>
      {open ? (
        <>
          <span className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <span className="fade-in absolute left-0 z-40 mt-1 block w-44 rounded-xl bg-white p-1 shadow-xl ring-1 ring-slate-200">
            {apps.map((a) => (
              <a
                key={a.key}
                href={a.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-2 py-1.5 text-right text-[11px] font-bold text-slate-700 hover:bg-teal-50"
              >
                {a.icon} {a.label}
              </a>
            ))}
          </span>
        </>
      ) : null}
    </span>
  );
}
