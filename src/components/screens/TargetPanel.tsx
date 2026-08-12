"use client";
import { useCallback, useEffect, useState } from "react";
import { Badge, Card, SectionTitle } from "@/components/ui";
import { useLive } from "@/lib/useLive";
import { JALALI_MONTHS, toPersianDigits, todayJalali } from "@/lib/jalali";
type Progress = {
  productKey: string;
  productLabel: string;
  quantity: number;
  priceDistributor: number;
  pricePharmacy: number;
  sold: number;
  bonus: number;
  remaining: number;
  percent: number;
  soldValueDistributor: number;
  soldValuePharmacy: number;
};
type Totals = {
  quantity: number;
  sold: number;
  bonus: number;
  remaining: number;
  valueDistributor: number;
  valuePharmacy: number;
  soldValueDistributor: number;
  soldValuePharmacy: number;
};
const money = (n: number) => toPersianDigits(Math.round(n).toLocaleString("en-US"));
const currentPeriod = () => todayJalali().slice(0, 7);
/**    —          */
export default function TargetPanel({ userId, compact = false }: { userId?: number; compact?: boolean }) {
  const [rows, setRows] = useState<Progress[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [percent, setPercent] = useState(0);
  const [period, setPeriod] = useState(currentPeriod());

  const load = useCallback(async () => {
    const q = new URLSearchParams({ period });
    if (userId) q.set("userId", String(userId));
    const res = await fetch(`/api/targets?${q}`, { cache: "no-store" });
    if (!res.ok) return;
    const d = await res.json();
    setRows(d.progress ?? []);
    setTotals(d.totals ?? null);
    setPercent(d.percent ?? 0);
  }, [period, userId]);
  useLive(load, 30000);
  const periods = (() => {
    const [y, m] = currentPeriod().split("/").map(Number);
    const out: string[] = [];
    for (let i = -5; i <= 1; i++) {
      let mm = m + i;
      let yy = y;
      while (mm <= 0) {
        mm += 12;
        yy -= 1;
      }
      while (mm > 12) {
        mm -= 12;
        yy += 1;
      }
      out.push(`${yy}/${String(mm).padStart(2, "0")}`);
    }
    return [...new Set(out)];
  })();
  const label = (p: string) => `${JALALI_MONTHS[Number(p.slice(5, 7)) - 1] ?? ""} ${toPersianDigits(p.slice(0, 4))}`;
  const active = rows.filter((r) => r.quantity > 0);
  if (active.length === 0 && !compact) {
    return (
      <Card>
        <SectionTitle icon=""> </SectionTitle>
        <p className="py-4 text-center text-xs text-slate-400">
                .     «»  .
        </p>
      </Card>
    );
  }
  if (active.length === 0) return null;
  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <SectionTitle icon="">  </SectionTitle>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-xl border border-slate-300 px-2 py-1.5 text-xs"
          >
            {periods.map((p) => (
              <option key={p} value={p}>
                {label(p)}
              </option>
            ))}
          </select>
          <Badge tone={percent >= 100 ? "green" : percent >= 60 ? "amber" : "slate"}>
             : {toPersianDigits(percent)}
          </Badge>
        </div>
      </div>
      {totals ? (
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["", toPersianDigits(totals.quantity), "bg-slate-50 text-slate-700"],
            ["", toPersianDigits(totals.sold), "bg-teal-50 text-teal-700"],
            ["", toPersianDigits(totals.remaining), "bg-amber-50 text-amber-700"],
            ["", toPersianDigits(totals.bonus), "bg-emerald-50 text-emerald-700"],
          ].map(([l, v, c]) => (
            <div key={l} className={`rounded-xl p-2.5 text-center ring-1 ring-slate-200 ${c}`}>
              <div className="text-lg font-black">{v}</div>
              <div className="text-[10px] font-bold opacity-70">{l}</div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="space-y-1.5">
        {active.map((r) => (
          <div key={r.productKey} className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="font-bold text-slate-800">{r.productLabel}</span>
              <span className="text-slate-500">
                 <b className="text-slate-700">{toPersianDigits(r.quantity)}</b>
              </span>
              <span className="text-teal-700">
                 <b>{toPersianDigits(r.sold)}</b>
              </span>
              <span className={r.remaining === 0 ? "text-emerald-700" : "text-rose-700"}>
                 <b>{toPersianDigits(r.remaining)}</b>
              </span>
              <span className="mr-auto text-[10px] font-black text-slate-600">{toPersianDigits(r.percent)}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded bg-slate-200">
              <div
                className={`h-full transition-all ${r.percent >= 100 ? "bg-emerald-500" : r.percent >= 60 ? "bg-teal-500
" : "bg-amber-500"}`}
                style={{ width: `${Math.min(100, r.percent)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {totals && (totals.soldValueDistributor > 0 || totals.valueDistributor > 0) ? (
        <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-200">
              (): <b className="text-slate-800">{money(totals.valueDistributor)}</b> 
            <div className="text-teal-700">
              : <b>{money(totals.soldValueDistributor)}</b> 
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-200">
              (): <b className="text-slate-800">{money(totals.valuePharmacy)}</b> 
            <div className="text-teal-700">
              : <b>{money(totals.soldValuePharmacy)}</b> 
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
