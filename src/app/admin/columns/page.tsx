"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Input, SectionTitle } from "@/components/ui";
import {
  AVAILABLE_COLUMNS,
  DEFAULT_COLUMNS,
  DEFAULT_PRODUCTS,
  type ColumnConfig,
  type ProductConfig,
} from "@/lib/defaults";
import { useConfirm } from "@/components/Confirm";
import { toPersianDigits } from "@/lib/jalali";

const TABLES = [
  { key: "pharmacies", label: "جدول داروخانه‌ها" },
  { key: "doctors", label: "جدول پزشکان" },
  { key: "orders", label: "جدول سفارشات" },
];

export default function ColumnsPage() {
  const [cols, setCols] = useState<Record<string, ColumnConfig[]>>(DEFAULT_COLUMNS);
  const [products, setProducts] = useState<ProductConfig[]>(DEFAULT_PRODUCTS);
  const [tab, setTab] = useState("pharmacies");
  const [msg, setMsg] = useState("");
  const [newProduct, setNewProduct] = useState("");
  const [addCol, setAddCol] = useState("");
  const confirm = useConfirm();

  const load = useCallback(async () => {
    const res = await fetch("/api/settings", { cache: "no-store" });
    if (!res.ok) return;
    const d = await res.json();
    const v = d.values ?? {};
    setProducts((v.products as ProductConfig[]) ?? DEFAULT_PRODUCTS);
    setCols({
      pharmacies: (v["columns.pharmacies"] as ColumnConfig[]) ?? DEFAULT_COLUMNS.pharmacies,
      doctors: (v["columns.doctors"] as ColumnConfig[]) ?? DEFAULT_COLUMNS.doctors,
      orders: (v["columns.orders"] as ColumnConfig[]) ?? DEFAULT_COLUMNS.orders,
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (key: string, value: unknown) => {
    if (!(await confirm({ title: "ذخیره تغییرات", message: "تغییرات ذخیره و بلافاصله در همه صفحات اعمال شود؟", confirmText: "ذخیره" })))
      return;
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    setMsg(res.ok ? "✅ ذخیره شد و بلافاصله در همه صفحات اعمال می‌شود" : "خطا در ذخیره");
  };

  const move = (list: ColumnConfig[], i: number, dir: -1 | 1) => {
    const next = [...list];
    const j = i + dir;
    if (j < 0 || j >= next.length) return next;
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  };

  const moveP = (i: number, dir: -1 | 1) => {
    const next = [...products];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setProducts(next);
  };

  const current = cols[tab] ?? [];

  return (
    <div className="space-y-4">
      <SectionTitle icon="🧱">مدیریت ستون‌ها و کالاها</SectionTitle>
      {msg ? <Alert kind="success">{msg}</Alert> : null}

      <Card>
        <div className="mb-3 flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 text-xs font-bold">
          {TABLES.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-3 py-2 ${tab === t.key ? "bg-teal-600 text-white" : "text-slate-600"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <p className="mb-2 text-[11px] text-slate-500">
          با تیک زدن، ستون نمایش داده می‌شود و با فلش‌ها ترتیب آن جابه‌جا می‌شود. عنوان ستون هم قابل تغییر است.
        </p>

        <ul className="space-y-1">
          {current.map((c, i) => (
            <li key={c.key} className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <span className="w-6 text-center text-[11px] text-slate-400">{toPersianDigits(i + 1)}</span>
              <input
                type="checkbox"
                className="size-4 accent-teal-600"
                checked={c.visible}
                onChange={(e) => {
                  const next = [...current];
                  next[i] = { ...c, visible: e.target.checked };
                  setCols({ ...cols, [tab]: next });
                }}
              />
              <Input
                value={c.label}
                onChange={(e) => {
                  const next = [...current];
                  next[i] = { ...c, label: e.target.value };
                  setCols({ ...cols, [tab]: next });
                }}
                className="max-w-[180px] px-2 py-1 text-xs"
              />
              <span className="text-[10px] text-slate-400">{c.key}</span>
              <div className="mr-auto flex gap-1">
                <button
                  onClick={() => setCols({ ...cols, [tab]: move(current, i, -1) })}
                  className="rounded-lg bg-white px-2 py-1 text-xs ring-1 ring-slate-200"
                >
                  ↑
                </button>
                <button
                  onClick={() => setCols({ ...cols, [tab]: move(current, i, 1) })}
                  className="rounded-lg bg-white px-2 py-1 text-xs ring-1 ring-slate-200"
                >
                  ↓
                </button>
                <button
                  onClick={async () => {
                    if (
                      !(await confirm({
                        title: "حذف ستون",
                        message: `ستون «${c.label}» از این جدول حذف شود؟ بعداً می‌توانید دوباره اضافه کنید.`,
                        confirmText: "حذف",
                        danger: true,
                      }))
                    )
                      return;
                    setCols({ ...cols, [tab]: current.filter((_, x) => x !== i) });
                  }}
                  className="rounded-lg bg-rose-100 px-2 py-1 text-xs font-bold text-rose-700"
                >
                  حذف
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200">
          <span className="text-[11px] font-bold text-slate-600">افزودن ستون:</span>
          <select
            value={addCol}
            onChange={(e) => setAddCol(e.target.value)}
            className="rounded-xl border border-slate-300 px-2 py-2 text-xs"
          >
            <option value="">انتخاب ستون...</option>
            {(AVAILABLE_COLUMNS[tab] ?? [])
              .filter((a) => !current.some((c) => c.key === a.key))
              .map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label}
                </option>
              ))}
          </select>
          <Button
            variant="soft"
            onClick={() => {
              const found = (AVAILABLE_COLUMNS[tab] ?? []).find((a) => a.key === addCol);
              if (!found) return;
              setCols({ ...cols, [tab]: [...current, { ...found, visible: true }] });
              setAddCol("");
            }}
          >
            ➕ افزودن
          </Button>
          <span className="text-[10px] text-slate-400">
            {toPersianDigits((AVAILABLE_COLUMNS[tab] ?? []).filter((a) => !current.some((c) => c.key === a.key)).length)}{" "}
            ستون قابل افزودن
          </span>
        </div>

        <div className="mt-3 flex gap-2">
          <Button onClick={() => save(`columns.${tab}`, current)}>💾 ذخیره ترتیب ستون‌ها</Button>
          <Button
            variant="ghost"
            onClick={async () => {
              if (!(await confirm({ title: "بازگردانی پیش‌فرض", message: "ستون‌های این جدول به حالت اولیه برگردند؟", confirmText: "بازگردانی" })))
                return;
              setCols({ ...cols, [tab]: DEFAULT_COLUMNS[tab] });
            }}
          >
            بازگردانی پیش‌فرض
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">کالاها و جوایز (ترتیب، عنوان، فعال/غیرفعال)</h3>
        <ul className="space-y-1">
          {products.map((p, i) => (
            <li key={p.key} className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <span className="w-6 text-center text-[11px] text-slate-400">{toPersianDigits(i + 1)}</span>
              <input
                type="checkbox"
                className="size-4 accent-teal-600"
                checked={p.enabled}
                onChange={(e) => {
                  const next = [...products];
                  next[i] = { ...p, enabled: e.target.checked };
                  setProducts(next);
                }}
              />
              <Input
                value={p.label}
                onChange={(e) => {
                  const next = [...products];
                  next[i] = { ...p, label: e.target.value };
                  setProducts(next);
                }}
                className="max-w-[150px] px-2 py-1 text-xs"
              />
              <Input
                value={p.bonusLabel}
                onChange={(e) => {
                  const next = [...products];
                  next[i] = { ...p, bonusLabel: e.target.value };
                  setProducts(next);
                }}
                className="max-w-[180px] px-2 py-1 text-xs"
              />
              <div className="mr-auto flex gap-1">
                <button onClick={() => moveP(i, -1)} className="rounded-lg bg-white px-2 py-1 text-xs ring-1 ring-slate-200">
                  ↑
                </button>
                <button onClick={() => moveP(i, 1)} className="rounded-lg bg-white px-2 py-1 text-xs ring-1 ring-slate-200">
                  ↓
                </button>
                <button
                  onClick={async () => {
                    if (
                      !(await confirm({
                        title: "حذف کالا",
                        message: `کالای «${p.label}» حذف شود؟`,
                        confirmText: "حذف",
                        danger: true,
                      }))
                    )
                      return;
                    setProducts(products.filter((_, x) => x !== i));
                  }}
                  className="rounded-lg bg-rose-100 px-2 py-1 text-xs font-bold text-rose-700"
                >
                  حذف
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex flex-wrap gap-2">
          <Input
            value={newProduct}
            onChange={(e) => setNewProduct(e.target.value)}
            placeholder="نام کالای جدید..."
            className="max-w-[220px]"
          />
          <Button
            variant="soft"
            onClick={() => {
              const label = newProduct.trim();
              if (!label) return;
              const key = `p_${Date.now()}`;
              setProducts([...products, { key, label, bonusLabel: `تعداد جایزه ${label}`, enabled: true }]);
              setNewProduct("");
            }}
          >
            ➕ افزودن کالا
          </Button>
          <Button onClick={() => save("products", products)}>💾 ذخیره کالاها</Button>
          <Button variant="ghost" onClick={() => setProducts(DEFAULT_PRODUCTS)}>
            بازگردانی پیش‌فرض
          </Button>
        </div>
      </Card>
    </div>
  );
}
