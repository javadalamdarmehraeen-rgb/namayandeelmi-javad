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
  valueDistributor: number;
  valuePharmacy: number;
  soldValueDistributor: number;
  soldValuePharmacy: number;
};

const money = (n: number) => toPersianDigits(Math.round(n).toLocaleString("en-US"));
const currentPeriod = () => todayJalali().slice(0, 7);

export default function TargetsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<ProductConfig[]>(DEFAULT_PRODUCTS);
  const [userId, setUserId] = useState<number | null>(null);
  const [period, setPeriod] = useState(currentPeriod());
  const [rows, setRows] = useState<Progress[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/users", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      const list: User[] = d.rows ?? [];
      setUsers(list);
      if (!userId && list.length) setUserId(list.find((u) => u.role === "rep")?.id ?? list[0].id);
    }
    const pr = await fetch("/api/settings?key=products", { cache: "no-store" });
    if (pr.ok) {
      const d = await pr.json();
      const v = d.value as ProductConfig[] | null;
      if (Array.isArray(v) && v.length) setProducts(v.filter((p) => p.enabled !== false));
    }
  }, [userId]);

  const loadTargets = useCallback(async () => {
    if (!userId) return;
    const res = await fetch(`/api/targets?userId=${userId}&period=${encodeURIComponent(period)}`, { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setRows(d.progress ?? []);
    }
  }, [userId, period]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadTargets();
  }, [loadTargets]);

  const setField = (key: string, field: keyof Progress, value: number) =>
    setRows((p) => p.map((r) => (r.productKey === key ? { ...r, [field]: value } : r)));

  const save = async () => {
    if (!userId) return;
    const rep = users.find((u) => u.id === userId);
    if (
      !(await confirm({
        title: "ذخیره تارگت",
        message: `تارگت «${rep?.fullName}» برای دوره ${toPersianDigits(period)} ذخیره شود؟`,
        confirmText: "ذخیره",
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
    setMsg(res.ok ? "✅ تارگت ذخیره شد و بلافاصله در فرم سفارش نماینده نمایش داده می‌شود" : "✖ خطا در ذخیره");
    loadTargets();
  };

  /** کپی قیمت‌ها روی همه نمایندگان */
  const copyPrices = async () => {
    if (
      !(await confirm({
        title: "اعمال قیمت‌ها برای همه",
        message: "قیمت پخش و داروخانه این جدول برای همه نمایندگان (با حفظ تعداد تارگت هرکدام) اعمال شود؟",
        confirmText: "اعمال",
      }))
    )
      return;
    setBusy(true);
    for (const u of users.filter((x) => x.role === "rep" || x.role === "sales")) {
      const cur = await fetch(`/api/targets?userId=${u.id}&period=${encodeURIComponent(period)}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      const existing: Progress[] = cur?.progress ?? [];
      await fetch("/api/targets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: u.id,
          period,
          items: rows.map((r) => ({
            productKey: r.productKey,
            quantity: existing.find((e) => e.productKey === r.productKey)?.quantity ?? 0,
            priceDistributor: r.priceDistributor,
            pricePharmacy: r.pricePharmacy,
          })),
        }),
      });
    }
    setBusy(false);
    setMsg("✅ قیمت‌ها برای همه نمایندگان اعمال شد");
  };

  const totals = useMemo(
    () =>
      rows.reduce(
        (a, r) => ({
          quantity: a.quantity + r.quantity,
          sold: a.sold + r.sold,
          remaining: a.remaining + r.remaining,
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

  const periods = useMemo(() => {
    const [y, m] = currentPeriod().split("/").map(Number);
    const out: string[] = [];
    for (let i = -6; i <= 6; i++) {
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
    return [...new Set(out)].sort();
  }, []);

  const label = (p: string) => `${JALALI_MONTHS[Number(p.slice(5, 7)) - 1] ?? ""} ${toPersianDigits(p.slice(0, 4))}`;
  const pct = totals.quantity > 0 ? Math.round((totals.sold / totals.quantity) * 100) : 0;

  return (
    <div className="space-y-4">
      <SectionTitle icon="🎯">تعریف تارگت فروش نمایندگان</SectionTitle>
      {msg ? <Alert kind={msg.startsWith("✖") ? "error" : "success"}>{msg}</Alert> : null}

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="نماینده">
            <select
              value={userId ?? ""}
              onChange={(e) => setUserId(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} {u.active ? "" : "(غیرفعال)"}
                </option>
              ))}
            </select>
          </Field>
          <Field label="دوره (ماه شمسی)">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            >
              {periods.map((p) => (
                <option key={p} value={p}>
                  {label(p)}
                </option>
              ))}
              <option value="">تارگت دائمی (بدون دوره)</option>
            </select>
          </Field>
          <div className="flex items-end gap-2">
            <Button onClick={save} disabled={busy} className="flex-1">
              💾 ذخیره تارگت
            </Button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["تارگت کل", toPersianDigits(totals.quantity), "bg-slate-50"],
            ["فروش انجام‌شده", toPersianDigits(totals.sold), "bg-teal-50"],
            ["باقیمانده", toPersianDigits(totals.remaining), "bg-amber-50"],
            ["درصد تحقق", `${toPersianDigits(pct)}٪`, pct >= 100 ? "bg-emerald-50" : "bg-sky-50"],
          ].map(([l, v, c]) => (
            <div key={l} className={`rounded-xl p-3 text-center ring-1 ring-slate-200 ${c}`}>
              <div className="text-lg font-black text-teal-700">{v}</div>
              <div className="text-[10px] font-bold text-slate-500">{l}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-700">تارگت و قیمت هر کالا</h3>
          <Button variant="soft" onClick={copyPrices} disabled={busy}>
            📋 اعمال قیمت‌ها برای همه نمایندگان
          </Button>
        </div>
        <div className="scroll-x">
          <table className="w-full min-w-[860px] text-right text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                <th className="px-2 py-2">کالا</th>
                <th className="px-2 py-2">تعداد تارگت</th>
                <th className="px-2 py-2">قیمت پخش (ریال)</th>
                <th className="px-2 py-2">قیمت داروخانه (ریال)</th>
                <th className="px-2 py-2">ارزش تارگت (پخش)</th>
                <th className="px-2 py-2">فروش</th>
                <th className="px-2 py-2">باقیمانده</th>
                <th className="px-2 py-2">تحقق</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.productKey} className="border-b border-slate-100">
                  <td className="whitespace-nowrap px-2 py-2 font-bold text-slate-800">{r.productLabel}</td>
                  <td className="px-2 py-2">
                    <Input
                      inputMode="numeric"
                      value={r.quantity || ""}
                      onChange={(e) => setField(r.productKey, "quantity", Number(e.target.value.replace(/\D/g, "")) || 0)}
                      className="w-24 px-2 py-1 text-center text-xs"
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
                    />
                  </td>
                  <td className="px-2 py-2 font-bold text-slate-600">{money(r.quantity * r.priceDistributor)}</td>
                  <td className="px-2 py-2 font-bold text-teal-700">{toPersianDigits(r.sold)}</td>
                  <td className="px-2 py-2 font-bold text-rose-700">{toPersianDigits(r.remaining)}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-16 overflow-hidden rounded bg-slate-200">
                        <div
                          className={`h-full ${r.percent >= 100 ? "bg-emerald-500" : "bg-teal-500"}`}
                          style={{ width: `${Math.min(100, r.percent)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold">{toPersianDigits(r.percent)}٪</span>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-teal-50 font-black text-teal-800">
                <td className="px-2 py-2">جمع کل</td>
                <td className="px-2 py-2 text-center">{toPersianDigits(totals.quantity)}</td>
                <td className="px-2 py-2" colSpan={2}>
                  ارزش تارگت داروخانه: {money(totals.valuePharmacy)}
                </td>
                <td className="px-2 py-2">{money(totals.valueDistributor)}</td>
                <td className="px-2 py-2 text-center">{toPersianDigits(totals.sold)}</td>
                <td className="px-2 py-2 text-center">{toPersianDigits(totals.remaining)}</td>
                <td className="px-2 py-2 text-center">{toPersianDigits(pct)}٪</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-3 text-xs ring-1 ring-slate-200">
            <b className="text-slate-700">ارزش فروش انجام‌شده (قیمت پخش):</b>{" "}
            <span className="font-black text-teal-700">{money(totals.soldValueDistributor)} ریال</span>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-xs ring-1 ring-slate-200">
            <b className="text-slate-700">ارزش فروش انجام‌شده (قیمت داروخانه):</b>{" "}
            <span className="font-black text-teal-700">{money(totals.soldValuePharmacy)} ریال</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
