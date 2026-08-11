"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Field, Input, SectionTitle } from "@/components/ui";
import { useConfirm } from "@/components/Confirm";
import { DEFAULT_PRODUCTS, type ProductConfig } from "@/lib/defaults";
import { JALALI_MONTHS, toPersianDigits, todayJalali } from "@/lib/jalali";
type User = { id: number; fullName: string; role: string; active: boolean };
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
};
const money = (n: number) => toPersianDigits(Math.round(n).toLocaleString("en-US"));
const nowYear = () => Number(todayJalali().slice(0, 4));
const nowMonth = () => Number(todayJalali().slice(5, 7));
export default function TargetsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<ProductConfig[]>(DEFAULT_PRODUCTS);
  const [userId, setUserId] = useState<number | null>(null);
  //    
  const [year, setYear] = useState<number>(nowYear());
  const [month, setMonth] = useState<number>(nowMonth());
  const [years, setYears] = useState<number[]>([]);
  const [newYear, setNewYear] = useState("");
  const [rows, setRows] = useState<Progress[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();
  const period = `${year}/${String(month).padStart(2, "0")}`;
  /* ----------      ---------- */
  const loadBase = useCallback(async () => {
    const res = await fetch("/api/users", { cache: "no-store" });
    if (res.ok) {
      const list: User[] = (await res.json()).rows ?? [];
      setUsers(list);
      setUserId((cur) => cur ?? list.find((u) => u.role === "rep")?.id ?? list[0]?.id ?? null);
    }
    const pr = await fetch("/api/settings?key=products", { cache: "no-store" });
    if (pr.ok) {
      const v = (await pr.json()).value as ProductConfig[] | null;
      if (Array.isArray(v) && v.length) setProducts(v.filter((p) => p.enabled !== false));
    }
    //     

    const yr = await fetch("/api/options?category=year", { cache: "no-store" });
    const saved: number[] = yr.ok
      ? ((await yr.json()).rows ?? []).map((r: { value: string }) => Number(r.value)).filter(Boolean)
      : [];
    const base = [nowYear() - 1, nowYear(), nowYear() + 1];
    setYears([...new Set([...base, ...saved])].sort((a, b) => a - b));
  }, []);
  const loadTargets = useCallback(async () => {
    if (!userId) return;
    const res = await fetch(`/api/targets?userId=${userId}&period=${encodeURIComponent(period)}`, { cache: "no-store" })
;
    if (res.ok) setRows((await res.json()).progress ?? []);
  }, [userId, period]);
  useEffect(() => {
    loadBase();
  }, [loadBase]);
  useEffect(() => {
    loadTargets();
  }, [loadTargets]);
  /**     —       */
  const setField = (key: string, field: "quantity" | "priceDistributor" | "pricePharmacy", value: number) =>
    setRows((p) => p.map((r) => (r.productKey === key ? { ...r, [field]: value } : r)));
  const addYear = async () => {
    const y = Number(newYear);
    if (!y || y < 1300 || y > 1500) return setMsg("      ( )");
    if (!(await confirm({ title: " ", message: ` ${toPersianDigits(y)}  `, confirmText: "" })
))
      return;
    const res = await fetch("/api/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "year", value: String(y) }),
    });
    if (res.ok) {
      setYears((p) => [...new Set([...p, y])].sort((a, b) => a - b));
      setYear(y);
      setNewYear("");
      setMsg(`  ${toPersianDigits(y)}  `);
    } else setMsg("    ");
  };
  const save = async () => {
    if (!userId) return;
    const rep = users.find((u) => u.id === userId);
    if (
      !(await confirm({
        title: " ",
        message: ` «${rep?.fullName}»  ${JALALI_MONTHS[month - 1]} ${toPersianDigits(year)}  `,
        confirmText: "",
      }))
    )
      return;
    setBusy(true);
    const res = await fetch("/api/targets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        period,
        items: rows.map((r) => ({
          productKey: r.productKey,
          quantity: r.quantity,
          priceDistributor: r.priceDistributor,
          pricePharmacy: r.pricePharmacy,
        })),
      }),
    });
    setBusy(false);
    setMsg(res.ok ? "              " : "   ");
    loadTargets();
  };
  /**        */
  const copyPrev = async () => {
    if (!userId) return;
    let pm = month - 1;
    let py = year;
    if (pm === 0) {
      pm = 12;
      py -= 1;
    }

    const prev = `${py}/${String(pm).padStart(2, "0")}`;
    const res = await fetch(`/api/targets?userId=${userId}&period=${encodeURIComponent(prev)}`, { cache: "no-store" });
    if (!res.ok) return setMsg("     ");
    const d = await res.json();
    const prevRows: Progress[] = d.progress ?? [];
    setRows((cur) =>
      cur.map((r) => {
        const p = prevRows.find((x) => x.productKey === r.productKey);
        return p ? { ...r, quantity: p.quantity, priceDistributor: p.priceDistributor, pricePharmacy: p.pricePharmacy } 
: r;
      }),
    );
    setMsg(`  ${JALALI_MONTHS[pm - 1]} ${toPersianDigits(py)}   —   «»  `);
  };
  /* ----------   ---------- */
  const totals = useMemo(
    () =>
      rows.reduce(
        (a, r) => ({
          quantity: a.quantity + r.quantity,
          sold: a.sold + r.sold,
          remaining: a.remaining + Math.max(0, r.quantity - r.sold),
          valueDistributor: a.valueDistributor + r.quantity * r.priceDistributor,
          valuePharmacy: a.valuePharmacy + r.quantity * r.pricePharmacy,
          soldValueDistributor: a.soldValueDistributor + r.sold * r.priceDistributor,
          soldValuePharmacy: a.soldValuePharmacy + r.sold * r.pricePharmacy,
        }),
        {
          quantity: 0,
          sold: 0,
          remaining: 0,
          valueDistributor: 0,
          valuePharmacy: 0,
          soldValueDistributor: 0,
          soldValuePharmacy: 0,
        },
      ),
    [rows],
  );
  const pct = totals.quantity > 0 ? Math.round((totals.sold / totals.quantity) * 100) : 0;
  const rep = users.find((u) => u.id === userId);
  return (
    <div className="space-y-4">
      <SectionTitle icon="">   —    </SectionTitle>
      {msg ? <Alert kind={msg.startsWith("") ? "error" : "success"}>{msg}</Alert> : null}
      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="" required>
            <select
              value={userId ?? ""}
              onChange={(e) => setUserId(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} {u.active ? "" : "()"}
                </option>
              ))}
            </select>
          </Field>
          <Field label="">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {toPersianDigits(y)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            >
              {JALALI_MONTHS.map((m, i) => (

                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="  " hint=" ">
            <div className="flex gap-1">
              <Input
                inputMode="numeric"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="1406"
                className="text-center"
              />
              <Button variant="soft" onClick={addYear}>
                
              </Button>
            </div>
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone="slate">
            {rep?.fullName ?? "—"} | {JALALI_MONTHS[month - 1]} {toPersianDigits(year)}
          </Badge>
          <Button onClick={save} disabled={busy}>
                
          </Button>
          <Button variant="ghost" onClick={copyPrev}>
                
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            [" ", toPersianDigits(totals.quantity), "bg-slate-50"],
            [" ", toPersianDigits(totals.sold), "bg-teal-50"],
            ["", toPersianDigits(totals.remaining), "bg-amber-50"],
            [" ", `${toPersianDigits(pct)}`, pct >= 100 ? "bg-emerald-50" : "bg-sky-50"],
          ].map(([l, v, c]) => (
            <div key={l} className={`rounded-xl p-3 text-center ring-1 ring-slate-200 ${c}`}>
              <div className="text-lg font-black text-teal-700">{v}</div>
              <div className="text-[10px] font-bold text-slate-500">{l}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">
               —      
        </h3>
        <div className="scroll-x">
          <table className="w-full min-w-[980px] text-right text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                <th className="px-2 py-2"></th>
                <th className="px-2 py-2"> </th>
                <th className="px-2 py-2">  ()</th>
                <th className="px-2 py-2">  ()</th>
                <th className="px-2 py-2 text-center"> </th>
                <th className="px-2 py-2 text-center"> </th>
                <th className="px-2 py-2 text-center"></th>
                <th className="px-2 py-2 text-center"></th>
                <th className="px-2 py-2 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const valD = r.quantity * r.priceDistributor;
                const valP = r.quantity * r.pricePharmacy;
                const remaining = Math.max(0, r.quantity - r.sold);
                const percent = r.quantity > 0 ? Math.round((r.sold / r.quantity) * 100) : 0;
                return (
                  <tr key={r.productKey} className="border-b border-slate-100">
                    <td className="whitespace-nowrap px-2 py-2 font-bold text-slate-800">{r.productLabel}</td>
                    <td className="px-2 py-2">
                      <Input
                        inputMode="numeric"
                        value={r.quantity || ""}
                        onChange={(e) => setField(r.productKey, "quantity", Number(e.target.value.replace(/\D/g, "")) ||
 0)}
                        className="w-24 px-2 py-1 text-center text-xs"

                        placeholder="0"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        inputMode="numeric"
                        value={r.priceDistributor || ""}
                        onChange={(e) =>
                          setField(r.productKey, "priceDistributor", Number(e.target.value.replace(/\D/g, "")) || 0)
                        }
                        className="w-32 px-2 py-1 text-center text-xs"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        inputMode="numeric"
                        value={r.pricePharmacy || ""}
                        onChange={(e) =>
                          setField(r.productKey, "pricePharmacy", Number(e.target.value.replace(/\D/g, "")) || 0)
                        }
                        className="w-32 px-2 py-1 text-center text-xs"
                        placeholder="0"
                      />
                    </td>
                    {/*   —  */}
                    <td className="px-2 py-2 text-center font-black text-slate-700">
                      <span className={valD ? "text-sky-700" : "text-slate-300"}>{money(valD)}</span>
                    </td>
                    <td className="px-2 py-2 text-center font-black">
                      <span className={valP ? "text-indigo-700" : "text-slate-300"}>{money(valP)}</span>
                    </td>
                    <td className="px-2 py-2 text-center font-bold text-teal-700">{toPersianDigits(r.sold)}</td>
                    <td className="px-2 py-2 text-center font-bold text-rose-700">{toPersianDigits(remaining)}</td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <div className="h-1.5 w-14 overflow-hidden rounded bg-slate-200">
                          <div
                            className={`h-full ${percent >= 100 ? "bg-emerald-500" : "bg-teal-500"}`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold">{toPersianDigits(percent)}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-teal-50 font-black text-teal-800">
                <td className="px-2 py-2"> </td>
                <td className="px-2 py-2 text-center">{toPersianDigits(totals.quantity)}</td>
                <td className="px-2 py-2" colSpan={2} />
                <td className="px-2 py-2 text-center">{money(totals.valueDistributor)}</td>
                <td className="px-2 py-2 text-center">{money(totals.valuePharmacy)}</td>
                <td className="px-2 py-2 text-center">{toPersianDigits(totals.sold)}</td>
                <td className="px-2 py-2 text-center">{toPersianDigits(totals.remaining)}</td>
                <td className="px-2 py-2 text-center">{toPersianDigits(pct)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-3 text-xs ring-1 ring-slate-200">
               ():{" "}
            <span className="font-black text-teal-700">{money(totals.soldValueDistributor)} </span>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-xs ring-1 ring-slate-200">
               ():{" "}
            <span className="font-black text-teal-700">{money(totals.soldValuePharmacy)} </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
