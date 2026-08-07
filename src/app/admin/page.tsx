"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Badge, Card, SectionTitle } from "@/components/ui";
import dynamic from "next/dynamic";

const ChartsPanel = dynamic(() => import("@/components/screens/ChartsPanel"), {
  ssr: false,
  loading: () => <div className="rounded-2xl bg-white p-6 text-center text-xs text-slate-400">در حال بارگذاری نمودارها...</div>,
});
import { tehranDateTime, toPersianDigits } from "@/lib/jalali";
import { useLive } from "@/lib/useLive";

type Counts = {
  pharmacies: number;
  doctors: number;
  orders: number;
  trips: number;
  activeTrips: number;
  users: number;
  leaves: number;
};
type Log = { id: number; userName: string; action: string; detail: string; createdAt: string };
type Rep = {
  id: number;
  fullName: string;
  role: string;
  active: boolean;
  lastSeenAt: string | null;
  pharmacies: number;
  doctors: number;
  orders: number;
  trips: number;
  activeTrip: number;
  lastAction: string | null;
  lastActionAt: string | null;
};

export default function AdminDashboard() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [reps, setReps] = useState<Rep[]>([]);
  const [byRep, setByRep] = useState<Record<string, Log[]>>({});
  const [openRep, setOpenRep] = useState<string | null>(null);
  const [live, setLive] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/activity", { cache: "no-store" });
    if (!res.ok) return;
    const d = await res.json();
    setCounts(d.counts);
    setReps(d.reps ?? []);
    setByRep(d.byRep ?? {});
  }, []);

  useLive(load, 20000, live);

  const tiles = [
    { label: "داروخانه‌ها", value: counts?.pharmacies ?? 0, icon: "🏥", href: "/admin/records/pharmacies" },
    { label: "پزشکان", value: counts?.doctors ?? 0, icon: "🩺", href: "/admin/records/doctors" },
    { label: "سفارشات", value: counts?.orders ?? 0, icon: "🧾", href: "/admin/records/orders" },
    { label: "ویزیت فعال", value: counts?.activeTrips ?? 0, icon: "📍", href: "/admin/trips" },
    { label: "مرخصی در انتظار", value: counts?.leaves ?? 0, icon: "📝", href: "/admin/leaves" },
    { label: "کاربران", value: counts?.users ?? 0, icon: "👤", href: "/admin/users" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle icon="📊">داشبورد مدیریت</SectionTitle>
        <button
          onClick={() => setLive((v) => !v)}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold ${live ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
        >
          {live ? "🔄 بروزرسانی خودکار روشن" : "⏸ بروزرسانی خودکار خاموش"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-slate-200 hover:ring-teal-300"
          >
            <div className="text-xl">{t.icon}</div>
            <div className="text-lg font-black text-teal-700">{toPersianDigits(t.value)}</div>
            <div className="text-[10px] font-bold text-slate-500">{t.label}</div>
          </Link>
        ))}
      </div>

      <Card>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <SectionTitle icon="🕒">فعالیت لحظه‌ای — به تفکیک هر نماینده</SectionTitle>
          <Link
            href="/admin/activity"
            className="rounded-xl bg-teal-600 px-3 py-2 text-xs font-bold text-white hover:bg-teal-700"
          >
            🔎 صفحه کامل فعالیت لحظه‌ای
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {reps.map((r) => {
            const logs = byRep[r.fullName] ?? [];
            const isOpen = openRep === r.fullName;
            return (
              <div key={r.id} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-800">{r.fullName}</span>
                  <Badge tone={r.role === "admin" ? "green" : r.role === "supervisor" ? "amber" : "slate"}>
                    {r.role === "admin" ? "مدیر" : r.role === "supervisor" ? "سرپرست" : "نماینده"}
                  </Badge>
                  {r.activeTrip > 0 ? <Badge tone="green">🚗 در حال ویزیت</Badge> : null}
                  {!r.active ? <Badge tone="amber">غیرفعال</Badge> : null}
                  <button
                    onClick={() => setOpenRep(isOpen ? null : r.fullName)}
                    className="mr-auto rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-teal-700 ring-1 ring-teal-200"
                  >
                    {isOpen ? "بستن" : `فعالیت‌ها (${toPersianDigits(logs.length)})`}
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[11px]">
                  {[
                    ["🏥", r.pharmacies],
                    ["🩺", r.doctors],
                    ["🧾", r.orders],
                    ["🗺️", r.trips],
                  ].map(([i, v], idx) => (
                    <div key={idx} className="rounded-lg bg-white py-1 ring-1 ring-slate-200">
                      <span>{i as string}</span> <b className="text-teal-700">{toPersianDigits(v as number)}</b>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  آخرین فعالیت: {r.lastAction ?? "—"}
                  {r.lastActionAt ? ` (${tehranDateTime(r.lastActionAt)})` : ""}
                </div>
                <div className="text-[11px] text-slate-400">
                  آخرین ورود: {r.lastSeenAt ? tehranDateTime(r.lastSeenAt) : "—"}
                </div>
                {isOpen ? (
                  <div className="mt-2 max-h-52 space-y-1 overflow-y-auto">
                    {logs.length === 0 ? (
                      <p className="text-xs text-slate-400">فعالیتی ثبت نشده است</p>
                    ) : (
                      logs.map((l) => (
                        <div key={l.id} className="rounded-lg bg-white px-2 py-1 text-[11px] ring-1 ring-slate-100">
                          <span className="font-bold text-teal-700">{l.action}</span>
                          {l.detail ? <span className="text-slate-600"> — {l.detail}</span> : null}
                          <span className="mr-2 text-[10px] text-slate-400">{tehranDateTime(l.createdAt)}</span>
                        </div>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <SectionTitle icon="⬇️">خروجی اکسل</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <a
            href="/admin/targets"
            className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
          >
            🎯 تارگت فروش
          </a>
          <a
            href="/admin/backup"
            className="rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-800 ring-1 ring-indigo-200 hover:bg-indigo-100"
          >
            💾 پشتیبان‌گیری
          </a>
          {[
            ["pharmacies", "داروخانه‌ها"],
            ["doctors", "پزشکان"],
            ["orders", "سفارشات"],
            ["trips", "ترددها"],
            ["leaves", "مرخصی‌ها"],
            ["homes", "منازل"],
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

      <ChartsPanel scope="admin" />
    </div>
  );
}
