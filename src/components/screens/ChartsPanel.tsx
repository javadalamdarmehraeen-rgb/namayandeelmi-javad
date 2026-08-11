"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Field, SectionTitle } from "@/components/ui";
import { BarChart, DonutChart, LineChart } from "@/components/Charts";
import JalaliDateInput from "@/components/JalaliDateInput";
import { JALALI_MONTHS, toPersianDigits, todayJalali } from "@/lib/jalali";
import { Alert } from "@/components/ui";
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
type ByRep = { period: string; repName: string; items: Record<string, number>; bonuses: Record<string, number> };
const MONTH_LABELS = JALALI_MONTHS.map((m) => m.slice(0, 4));
export default function ChartsPanel({ scope = "rep" }: { scope?: "rep" | "admin" }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [byRep, setByRep] = useState<ByRep[]>([]);
  const [products, setProducts] = useState<ProductConfig[]>(DEFAULT_PRODUCTS);
  const [metric, setMetric] = useState<"orders" | "units" | "pharmacies" | "doctors" | "trips">("units");
  const [rep, setRep] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  //       « »  
  const [applied, setApplied] = useState<{ from: string; to: string; rep: string }>({ from: "", to: "", rep: "" });
  const [msg, setMsg] = useState("");
  const load = useCallback(async () => {
    const [r1, r2] = await Promise.all([
      fetch("/api/reports", { cache: "no-store" }),
      fetch("/api/settings?key=products", { cache: "no-store" }),
    ]);
    if (r1.ok) {
      const d = await r1.json();
      setRows(d.rows ?? []);
      setByRep(d.productByRep ?? []);
    }
    if (r2.ok) {
      const d = await r2.json();
      const v = d.value as ProductConfig[] | null;
      if (Array.isArray(v) && v.length) setProducts(v.filter((p) => p.enabled !== false));
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const reps = useMemo(() => [...new Set(rows.map((r) => r.repName))].sort(), [rows]);
  const years = useMemo(() => [...new Set(rows.map((r) => r.period.slice(0, 4)))].sort(), [rows]);
  const inRange = useCallback(
    (period: string) => {
      if (applied.from && period < applied.from.slice(0, 7)) return false;
      if (applied.to && period > applied.to.slice(0, 7)) return false;
      return true;
    },
    [applied],
  );
  const scoped = useMemo(
    () => rows.filter((r) => (!applied.rep || r.repName === applied.rep) && inRange(r.period)),
    [rows, applied.rep, inRange],
  );
  const apply = () => {
    if (from && to && from > to) {
      setMsg(" « »    « » ");
      return;
    }
    setApplied({ from, to, rep });
    setMsg(
      from || to || rep
        ? `   ${from ? ` —  ${toPersianDigits(from)}` : ""}${to ? `  ${toPersianDigits(to)}` : ""}${rep
 ? ` | ${rep}` : ""}`
        : "   ",
    );
    load();
  };
  const reset = () => {
    setFrom("");
    setTo("");
    setRep("");
    setApplied({ from: "", to: "", rep: "" });
    setMsg("   —     ");
  };
  const quick = (months: number) => {
    const t = todayJalali();

    const [jy, jm] = t.split("/").map(Number);
    let y = jy;
    let m = jm - months + 1;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    const f = `${y}/${String(m).padStart(2, "0")}/01`;
    setFrom(f);
    setTo(t);
    setApplied({ from: f, to: t, rep });
    setMsg(` ${toPersianDigits(months)}  `);
  };
  const metricLabel: Record<string, string> = {
    units: "  ",
    orders: " ",
    pharmacies: " ",
    doctors: " ",
    trips: " ",
  };
  //    :       
  const yearSeries = useMemo(
    () =>
      years.map((y) => ({
        name: toPersianDigits(y),
        values: Array.from({ length: 12 }, (_, m) => {
          const per = `${y}/${String(m + 1).padStart(2, "0")}`;
          return scoped.filter((r) => r.period === per).reduce((a, r) => a + r[metric], 0);
        }),
      })),
    [years, scoped, metric],
  );
  //    ( )
  const monthly = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of scoped) m.set(r.period, (m.get(r.period) ?? 0) + r[metric]);
    return [...m.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, value]) => ({ label: toPersianDigits(label), value }));
  }, [scoped, metric]);
  //   
  const productShare = useMemo(() => {
    const filtered = byRep.filter((r) => (!applied.rep || r.repName === applied.rep) && inRange(r.period));
    return products
      .map((p) => ({
        label: p.label,
        value: filtered.reduce((a, r) => a + (r.items[p.key] ?? 0), 0),
      }))
      .filter((d) => d.value > 0);
  }, [byRep, products, applied.rep, inRange]);
  //   ( )
  const repCompare = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows.filter((x) => inRange(x.period))) m.set(r.repName, (m.get(r.repName) ?? 0) + r[metric]);
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [rows, metric, inRange]);
  const totals = scoped.reduce(
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
  return (
    <div className="space-y-4">
      <SectionTitle icon="">   </SectionTitle>
      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label=" ">
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as typeof metric)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"

            >
              {Object.entries(metricLabel).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          {scope === "admin" ? (
            <Field label="">
              <select
                value={rep}
                onChange={(e) => setRep(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              >
                <option value=""> </option>
                {reps.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          <Field label=" ">
            <JalaliDateInput value={from} onChange={setFrom} placeholder="//" />
          </Field>
          <Field label=" ">
            <JalaliDateInput value={to} onChange={setTo} placeholder="//" />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={apply}>    </Button>
          <Button variant="ghost" onClick={reset}>
              
          </Button>
          <span className="mx-1 h-6 w-px bg-slate-200" />
          <Button variant="soft" onClick={() => quick(1)}>
             
          </Button>
          <Button variant="soft" onClick={() => quick(3)}>
              
          </Button>
          <Button variant="soft" onClick={() => quick(6)}>
              
          </Button>
          <Button variant="soft" onClick={() => quick(12)}>
              
          </Button>
        </div>
        {msg ? (
          <div className="mt-2">
            <Alert kind={msg.startsWith("") ? "error" : "success"}>{msg}</Alert>
          </div>
        ) : null}
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {[
            [" ", totals.pharmacies],
            [" ", totals.doctors],
            [" ", totals.orders],
            [" ", totals.units],
            [" ", totals.bonus],
            [" ", totals.trips],
          ].map(([l, v]) => (
            <div key={String(l)} className="rounded-xl bg-slate-50 p-2 text-center ring-1 ring-slate-200">
              <div className="text-base font-black text-teal-700">{toPersianDigits(v as number)}</div>
              <div className="text-[10px] font-bold text-slate-500">{l as string}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">
               — {metricLabel[metric]}
        </h3>
        <LineChart labels={MONTH_LABELS} series={yearSeries} />
      </Card>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <h3 className="mb-2 text-sm font-bold text-slate-700">    </h3>
          <BarChart data={monthly} />

        </Card>
        <Card>
          <h3 className="mb-2 text-sm font-bold text-slate-700">     </h3>
          <DonutChart data={productShare} />
        </Card>
      </div>
      {scope === "admin" ? (
        <Card>
          <h3 className="mb-2 text-sm font-bold text-slate-700">   — {metricLabel[metric]}</h3>
          <BarChart data={repCompare} />
        </Card>
      ) : null}
    </div>
  );
}
