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
        <SectionTitle icon="">  </SectionTitle>
        <Button variant={live ? "success" : "ghost"} onClick={() => setLive((v) => !v)}>
          {live ? "  (  )" : " "}
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <h3 className="mb-2 text-sm font-bold text-slate-700">   </h3>
          <BarChart data={perRep} />
        </Card>
        <Card>
          <h3 className="mb-2 text-sm font-bold text-slate-700"> </h3>
          <BarChart data={perAction} />
        </Card>
      </div>
      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">    —   </h3>
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
                {r.activeTrip > 0 ? <Badge tone="green">   </Badge> : null}
                {!r.active ? <Badge tone="amber"></Badge> : null}
              </div>
              <div className="mt-1 grid grid-cols-4 gap-1 text-center text-[10px]">
                <span className="rounded bg-white py-1 ring-1 ring-slate-200"> {toPersianDigits(r.pharmacies)}</span>
                <span className="rounded bg-white py-1 ring-1 ring-slate-200"> {toPersianDigits(r.doctors)}</span>
                <span className="rounded bg-white py-1 ring-1 ring-slate-200"> {toPersianDigits(r.orders)}</span>
                <span className="rounded bg-white py-1 ring-1 ring-slate-200"> {toPersianDigits(r.trips)}</span>
              </div>
              <div className="mt-1 truncate text-[10px] text-slate-500">{r.lastAction ?? " "}</div>
              <div className="text-[10px] text-slate-400">
                {r.lastActionAt ? tehranDateTime(r.lastActionAt) : "—"}
              </div>
            </button>
          ))}
        </div>
      </Card>
      {/* ----------     ---------- */}
      {rep ? (
        <Card>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-black text-teal-800">   «{rep}»</h3>
            <Button variant="ghost" onClick={() => setRep("")}>
                
            </Button>

          </div>
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(() => {
              const r = reps.find((x) => x.fullName === rep);
              return [
                [" ", r?.pharmacies ?? 0],
                [" ", r?.doctors ?? 0],
                [" ", r?.orders ?? 0],
                ["  ", r?.trips ?? 0],
              ].map(([l, v]) => (
                <div key={String(l)} className="rounded-xl bg-slate-50 p-3 text-center ring-1 ring-slate-200">
                  <div className="text-lg font-black text-teal-700">{toPersianDigits(v as number)}</div>
                  <div className="text-[10px] font-bold text-slate-500">{l as string}</div>
                </div>
              ));
            })()}
          </div>
          <div className="mb-3">
            <h4 className="mb-1 text-xs font-bold text-slate-600">  </h4>
            <div className="flex flex-wrap gap-1">
              {perAction.map((a) => (
                <span key={a.label} className="rounded-lg bg-teal-50 px-2 py-1 text-[11px] font-bold text-teal-700 ring-
1 ring-teal-200">
                  {a.label}: {toPersianDigits(a.value)}
                </span>
              ))}
              {perAction.length === 0 ? <span className="text-[11px] text-slate-400">  </span> : null}
            </div>
          </div>
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {filtered.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs">
                <span className="rounded-lg bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700">{l.action}</spa
n>
                {l.detail ? <span className="text-slate-600">{l.detail}</span> : null}
                <span className="mr-auto text-[10px] text-slate-400">{tehranDateTime(l.createdAt)}</span>
              </div>
            ))}
            {filtered.length === 0 ? <p className="py-4 text-center text-slate-400">  </p> : null}
          </div>
        </Card>
      ) : null}
      <Card>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-slate-700">   </h3>
          <Input placeholder=" ..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-[220px]" />
          {rep ? (
            <Button variant="ghost" onClick={() => setRep("")}>
                «{rep}»
            </Button>
          ) : null}
          <Badge tone="slate">{toPersianDigits(filtered.length)} </Badge>
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
          {filtered.length === 0 ? <p className="py-6 text-center text-slate-400">  </p> : null}
        </div>
      </Card>
    </div>
  );
}
