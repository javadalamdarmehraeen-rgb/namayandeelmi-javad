"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, SectionTitle } from "@/components/ui";
import { tehranDateTime, toPersianDigits } from "@/lib/jalali";

type Counts = {
  pharmacies: number;
  doctors: number;
  orders: number;
  trips: number;
  activeTrips: number;
  users: number;
};
type Log = { id: number; userName: string; action: string; detail: string; createdAt: string };

export default function AdminDashboard() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/activity", { cache: "no-store" });
      if (!res.ok) return;
      const d = await res.json();
      setCounts(d.counts);
      setLogs(d.logs ?? []);
    };
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  const tiles = [
    { label: "داروخانه‌ها", value: counts?.pharmacies ?? 0, icon: "🏥", href: "/admin/records/pharmacies" },
    { label: "پزشکان", value: counts?.doctors ?? 0, icon: "🩺", href: "/admin/records/doctors" },
    { label: "سفارشات", value: counts?.orders ?? 0, icon: "🧾", href: "/admin/records/orders" },
    { label: "ویزیت‌های فعال", value: counts?.activeTrips ?? 0, icon: "📍", href: "/admin/trips" },
    { label: "کل سفرها", value: counts?.trips ?? 0, icon: "🗺️", href: "/admin/trips" },
    { label: "کاربران", value: counts?.users ?? 0, icon: "👤", href: "/admin/users" },
  ];

  return (
    <div className="space-y-4">
      <SectionTitle icon="📊">داشبورد مدیریت</SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-200 transition hover:ring-teal-300"
          >
            <div className="text-2xl">{t.icon}</div>
            <div className="mt-1 text-xl font-black text-teal-700">{toPersianDigits(t.value)}</div>
            <div className="text-[11px] font-bold text-slate-500">{t.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <SectionTitle icon="⬇️">خروجی اکسل</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {[
              ["pharmacies", "داروخانه‌ها"],
              ["doctors", "پزشکان"],
              ["orders", "سفارشات"],
              ["trips", "ترددها"],
              ["users", "کاربران"],
            ].map(([k, l]) => (
              <a
                key={k}
                href={`/api/export?type=${k}`}
                className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-100"
              >
                ⬇️ {l}
              </a>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle icon="🕒">فعالیت لحظه‌ای نمایندگان</SectionTitle>
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-sm text-slate-400">فعالیتی ثبت نشده است</p>
            ) : (
              logs.map((l) => (
                <div key={l.id} className="rounded-xl bg-slate-50 px-3 py-2 text-xs">
                  <span className="font-bold text-slate-700">{l.userName}</span>
                  <span className="mx-1 text-slate-400">—</span>
                  <span className="text-teal-700">{l.action}</span>
                  {l.detail ? <span className="text-slate-500"> ({l.detail})</span> : null}
                  <span className="mr-2 text-[10px] text-slate-400">{tehranDateTime(l.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
