"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, SectionTitle } from "@/components/ui";
import TargetPanel from "@/components/screens/TargetPanel";
import { JALALI_MONTHS, toPersianDigits } from "@/lib/jalali";
import { DEFAULT_PRODUCTS, type ProductConfig } from "@/lib/defaults";
import { downloadFile } from "@/lib/download";
type Row = {
  period: string;
  repName: string;
  pharmacies: number;
  doctors: number;
  orders: number;
  units: number;
  bonus: number;
  trips: number;
};
export default function ReportScreen({ compact = false }: { compact?: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [byRep, setByRep] = useState<
    { period: string; repName: string; items: Record<string, number>; bonuses: Record<string, number> }[]
  >([]);
  const [rep, setRep] = useState("");
  const [products, setProducts] = useState<ProductConfig[]>(DEFAULT_PRODUCTS);
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const load = useCallback(async () => {
    const res = await fetch("/api/reports", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setRows(d.rows ?? []);
      setByRep(d.productByRep ?? []);
    }
  }, []);
  useEffect(() => {
    load();
    fetch("/api/settings?key=products", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const v = d?.value as ProductConfig[] | null;
        if (Array.isArray(v) && v.length) setProducts(v.filter((p) => p.enabled !== false));
      })
      .catch(() => undefined);
  }, [load]);
  const years = useMemo(() => [...new Set(rows.map((r) => r.period.slice(0, 4)))].sort().reverse(), [rows]);
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) => (!year || r.period.startsWith(year)) && (!month || r.period.slice(5, 7) === month.padStart(2, "0")),
      ),
    [rows, year, month],
  );
  const sum = filtered.reduce(
    (a, r) => ({
      pharmacies: a.pharmacies + r.pharmacies,
      doctors: a.doctors + r.doctors,
      orders: a.orders + r.orders,
      units: a.units + r.units,
      bonus: a.bonus + r.bonus,
      trips: a.trips + r.trips,
    }),
    { pharmacies: 0, doctors: 0, orders: 0, units: 0, bonus: 0, trips: 0 },
  );
  const reps = useMemo(() => [...new Set(byRep.map((r) => r.repName))].sort(), [byRep]);

  const byRepFiltered = useMemo(
    () =>
      byRep.filter(
        (r) =>
          (!year || r.period.startsWith(year)) &&
          (!month || r.period.slice(5, 7) === month.padStart(2, "0")) &&
          (!rep || r.repName === rep),
      ),
    [byRep, year, month, rep],
  );
  const monthName = (p: string) => {
    const m = Number(p.slice(5, 7));
    return `${JALALI_MONTHS[m - 1] ?? ""} ${toPersianDigits(p.slice(0, 4))}`;
  };
  return (
    <div className="space-y-4">
      {!compact ? <SectionTitle icon="">      </SectionTitle> : null}
      <TargetPanel />
      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value=""> </option>
            {years.map((y) => (
              <option key={y} value={y}>
                {toPersianDigits(y)}
              </option>
            ))}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value=""> </option>
            {JALALI_MONTHS.map((m, i) => (
              <option key={m} value={String(i + 1)}>
                {m}
              </option>
            ))}
          </select>
          <div className="flex-1" />
          <button
            onClick={() =>
              downloadFile(
                `/api/export?type=orders${year ? `&year=${year}` : ""}${month ? `&month=${month}` : ""}`,
                "orders.xls",
              )
            }
            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
          >
                
          </button>
        </div>
        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {[
            ["", sum.pharmacies, ""],
            ["", sum.doctors, ""],
            ["", sum.orders, ""],
            [" ", sum.units, ""],
            [" ", sum.bonus, ""],
            [" ", sum.trips, ""],
          ].map(([l, v, i]) => (
            <div key={String(l)} className="rounded-xl bg-slate-50 p-3 text-center ring-1 ring-slate-200">
              <div className="text-lg">{i as string}</div>
              <div className="text-lg font-black text-teal-700">{toPersianDigits(v as number)}</div>
              <div className="text-[10px] font-bold text-slate-500">{l as string}</div>
            </div>
          ))}
        </div>
        <div className="scroll-x">
          <table className="w-full min-w-[680px] text-right text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                <th className="px-2 py-2"></th>

                <th className="px-2 py-2"> </th>
                <th className="px-2 py-2"></th>
                <th className="px-2 py-2"></th>
                <th className="px-2 py-2"></th>
                <th className="px-2 py-2"> </th>
                <th className="px-2 py-2"></th>
                <th className="px-2 py-2"> </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={`${r.period}-${r.repName}`} className="border-b border-slate-100">
                  <td className="px-2 py-2 font-bold text-teal-700">{monthName(r.period)}</td>
                  <td className="px-2 py-2">{r.repName}</td>
                  <td className="px-2 py-2">{toPersianDigits(r.pharmacies)}</td>
                  <td className="px-2 py-2">{toPersianDigits(r.doctors)}</td>
                  <td className="px-2 py-2">{toPersianDigits(r.orders)}</td>
                  <td className="px-2 py-2">{toPersianDigits(r.units)}</td>
                  <td className="px-2 py-2">{toPersianDigits(r.bonus)}</td>
                  <td className="px-2 py-2">{toPersianDigits(r.trips)}</td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">
                         
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
      {!compact ? (
        <Card>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-slate-700">   —      </h3>
            <select
              value={rep}
              onChange={(e) => setRep(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
            >
              <option value=""> </option>
              {reps.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="scroll-x">
            <table className="w-full min-w-[760px] text-right text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600">
                  <th className="px-2 py-2">  </th>
                  <th className="px-2 py-2"> </th>
                  {products.map((p) => (
                    <th key={p.key} className="px-2 py-2 text-center">
                      {p.label}
                      <div className="text-[9px] font-normal text-slate-400"> / </div>
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {byRepFiltered.map((r) => {
                  const sumUnits = products.reduce((a, p) => a + (r.items[p.key] ?? 0), 0);
                  return (
                    <tr key={`${r.period}-${r.repName}`} className="border-b border-slate-100">
                      <td className="whitespace-nowrap px-2 py-2 font-bold text-teal-700">{monthName(r.period)}</td>
                      <td className="whitespace-nowrap px-2 py-2 font-semibold text-slate-700">{r.repName}</td>
                      {products.map((p) => (
                        <td key={p.key} className="px-2 py-2 text-center">
                          <span className="font-bold text-slate-800">{toPersianDigits(r.items[p.key] ?? 0)}</span>
                          <span className="text-slate-400"> / </span>
                          <span className="text-emerald-600">{toPersianDigits(r.bonuses[p.key] ?? 0)}</span>
                        </td>
                      ))}
                      <td className="px-2 py-2 text-center font-black text-teal-700">{toPersianDigits(sumUnits)}</td>
                    </tr>
                  );
                })}

                {byRepFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={products.length + 3} className="py-6 text-center text-slate-400">
                            
                    </td>
                  </tr>
                ) : (
                  <tr className="bg-teal-50 font-black text-teal-800">
                    <td className="px-2 py-2" colSpan={2}>
                        
                    </td>
                    {products.map((p) => (
                      <td key={p.key} className="px-2 py-2 text-center">
                        {toPersianDigits(byRepFiltered.reduce((a, r) => a + (r.items[p.key] ?? 0), 0))}
                        <span className="text-slate-400"> / </span>
                        <span className="text-emerald-700">
                          {toPersianDigits(byRepFiltered.reduce((a, r) => a + (r.bonuses[p.key] ?? 0), 0))}
                        </span>
                      </td>
                    ))}
                    <td className="px-2 py-2 text-center">
                      {toPersianDigits(
                        byRepFiltered.reduce(
                          (a, r) => a + products.reduce((x, p) => x + (r.items[p.key] ?? 0), 0),
                          0,
                        ),
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
                 « »    « » .
          </p>
        </Card>
      ) : null}
    </div>
  );
}
