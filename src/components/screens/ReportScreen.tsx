"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, SectionTitle } from "@/components/ui";
import { JALALI_MONTHS, toPersianDigits } from "@/lib/jalali";
import { DEFAULT_PRODUCTS, type ProductConfig } from "@/lib/defaults";

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
  const [totals, setTotals] = useState<Record<string, Record<string, number>>>({});
  const [products, setProducts] = useState<ProductConfig[]>(DEFAULT_PRODUCTS);
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/reports", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setRows(d.rows ?? []);
      setTotals(d.productTotals ?? {});
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

  const monthName = (p: string) => {
    const m = Number(p.slice(5, 7));
    return `${JALALI_MONTHS[m - 1] ?? ""} ${toPersianDigits(p.slice(0, 4))}`;
  };

  return (
    <div className="space-y-4">
      {!compact ? <SectionTitle icon="📈">گزارش عملکرد به تفکیک ماه و سال</SectionTitle> : null}

      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">همه سال‌ها</option>
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
            <option value="">همه ماه‌ها</option>
            {JALALI_MONTHS.map((m, i) => (
              <option key={m} value={String(i + 1)}>
                {m}
              </option>
            ))}
          </select>
          <div className="flex-1" />
          <a
            href={`/api/export?type=orders${year ? `&year=${year}` : ""}${month ? `&month=${month}` : ""}`}
            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
          >
            ⬇️ اکسل سفارشات این دوره
          </a>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {[
            ["داروخانه", sum.pharmacies, "🏥"],
            ["پزشک", sum.doctors, "🩺"],
            ["سفارش", sum.orders, "🧾"],
            ["تعداد کل", sum.units, "📦"],
            ["جایزه کل", sum.bonus, "🎁"],
            ["سفر ویزیت", sum.trips, "🗺️"],
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
                <th className="px-2 py-2">ماه</th>
                <th className="px-2 py-2">نام نماینده</th>
                <th className="px-2 py-2">داروخانه</th>
                <th className="px-2 py-2">پزشک</th>
                <th className="px-2 py-2">سفارش</th>
                <th className="px-2 py-2">تعداد اقلام</th>
                <th className="px-2 py-2">جایزه</th>
                <th className="px-2 py-2">سفر ویزیت</th>
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
                    داده‌ای برای این دوره وجود ندارد
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {!compact ? (
        <Card>
          <h3 className="mb-2 text-sm font-bold text-slate-700">فروش هر قلم به تفکیک ماه</h3>
          <div className="scroll-x">
            <table className="w-full min-w-[680px] text-right text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600">
                  <th className="px-2 py-2">ماه</th>
                  {products.map((p) => (
                    <th key={p.key} className="px-2 py-2">
                      {p.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(totals)
                  .filter(([per]) => (!year || per.startsWith(year)) && (!month || per.slice(5, 7) === month.padStart(2, "0")))
                  .sort((a, b) => b[0].localeCompare(a[0]))
                  .map(([per, vals]) => (
                    <tr key={per} className="border-b border-slate-100">
                      <td className="px-2 py-2 font-bold text-teal-700">{monthName(per)}</td>
                      {products.map((p) => (
                        <td key={p.key} className="px-2 py-2">
                          {toPersianDigits(vals[p.key] ?? 0)}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
