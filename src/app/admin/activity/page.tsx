"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Input, SectionTitle } from "@/components/ui";
import { BarChart } from "@/components/Charts";
import { tehranDateTime, toPersianDigits } from "@/lib/jalali";
import { useLive } from "@/lib/useLive";

type Log = { id: number; userId: number | null; userName: string; action: string; detail: string; createdAt: string };
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

export default function ActivityPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [reps, setReps] = useState<Rep[]>([]);
  const [q, setQ] = useState("");
  const [rep, setRep] = useState("");
  const [live, setLive] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/activity", { cache: "no-store" });
    if (!res.ok) return;
    const d = await res.json();
    setLogs(d.logs ?? []);
    setReps(d.reps ?? []);
  }, []);

  useLive(load, 12000, live);

  const filtered = useMemo(
    () =>
      logs.filter(
        (l) =>
          (!rep || l.userName === rep) &&
          (!q || `${l.userName} ${l.action} ${l.detail}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [logs, rep, q],
  );

  const perRep = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of logs) m.set(l.userName, (m.get(l.userName) ?? 0) + 1);
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [logs]);

  const perAction = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of filtered) m.set(l.action, (m.get(l.action) ?? 0) + 1);
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle icon="🕒">فعالیت لحظه‌ای نمایندگان</SectionTitle>
        <Button variant={live ? "success" : "ghost"} onClick={() => setLive((v) => !v)}>
          {live ? "🔴 زنده (هر ۱۵ ثانیه)" : "⏸ متوقف"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <h3 className="mb-2 text-sm font-bold text-slate-700">تعداد فعالیت هر نماینده</h3>
          <BarChart data={perRep} />
        </Card>
        <Card>
          <h3 className="mb-2 text-sm font-bold text-slate-700">نوع فعالیت‌ها</h3>
          <BarChart data={perAction} />
        </Card>
      </div>

      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">وضعیت لحظه‌ای هر نماینده</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {reps.map((r) => (
            <button
              key={r.id}
              onClick={() => setRep(rep === r.fullName ? "" : r.fullName)}
              className={`rounded-xl p-3 text-right ring-1 transition ${
                rep === r.fullName ? "bg-teal-50 ring-teal-300" : "bg-slate-50 ring-slate-200 hover:bg-slate-100"
              }`}
            >
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-sm font-bold text-slate-800">{r.fullName}</span>
                {r.activeTrip > 0 ? <Badge tone="green">🚗 در حال ویزیت</Badge> : null}
                {!r.active ? <Badge tone="amber">غیرفعال</Badge> : null}
              </div>
              <div className="mt-1 grid grid-cols-4 gap-1 text-center text-[10px]">
                <span className="rounded bg-white py-1 ring-1 ring-slate-200">🏥 {toPersianDigits(r.pharmacies)}</span>
                <span className="rounded bg-white py-1 ring-1 ring-slate-200">🩺 {toPersianDigits(r.doctors)}</span>
                <span className="rounded bg-white py-1 ring-1 ring-slate-200">🧾 {toPersianDigits(r.orders)}</span>
                <span className="rounded bg-white py-1 ring-1 ring-slate-200">🗺️ {toPersianDigits(r.trips)}</span>
              </div>
              <div className="mt-1 truncate text-[10px] text-slate-500">{r.lastAction ?? "بدون فعالیت"}</div>
              <div className="text-[10px] text-slate-400">
                {r.lastActionAt ? tehranDateTime(r.lastActionAt) : "—"}
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-slate-700">جریان فعالیت‌ها</h3>
          <Input placeholder="🔍 جستجو..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-[220px]" />
          {rep ? (
            <Button variant="ghost" onClick={() => setRep("")}>
              حذف فیلتر «{rep}»
            </Button>
          ) : null}
          <Badge tone="slate">{toPersianDigits(filtered.length)} رویداد</Badge>
        </div>
        <div className="max-h-[480px] space-y-1 overflow-y-auto">
          {filtered.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs">
              <span className="font-bold text-slate-800">{l.userName}</span>
              <span className="rounded-lg bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700">{l.action}</span>
              {l.detail ? <span className="text-slate-600">{l.detail}</span> : null}
              <span className="mr-auto text-[10px] text-slate-400">{tehranDateTime(l.createdAt)}</span>
            </div>
          ))}
          {filtered.length === 0 ? <p className="py-6 text-center text-slate-400">رویدادی یافت نشد</p> : null}
        </div>
      </Card>
    </div>
  );
}
