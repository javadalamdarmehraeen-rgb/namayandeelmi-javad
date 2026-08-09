"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Field, Input, SectionTitle } from "@/components/ui";
import {
  AVAILABLE_COLUMNS,
  DEFAULT_COLUMNS,
  DEFAULT_PRODUCTS,
  scopeOf,
  type ColumnConfig,
  type FieldScope,
  type FieldType,
  type ProductConfig,
} from "@/lib/defaults";
import { useConfirm } from "@/components/Confirm";
import { toPersianDigits } from "@/lib/jalali";

const TABLES = [
  { key: "pharmacies", label: "داروخانه‌ها", icon: "🏥" },
  { key: "doctors", label: "پزشکان", icon: "🩺" },
  { key: "orders", label: "سفارشات", icon: "🧾" },
];

const SCOPE_LABEL: Record<FieldScope, string> = {
  form: "فقط فرم ثبت",
  list: "فقط لیست",
  both: "فرم و لیست",
};

const TYPE_LABEL: Record<FieldType, string> = {
  text: "متن کوتاه",
  number: "عدد",
  textarea: "متن بلند",
  select: "کشویی",
  phone: "شماره تماس",
};

const normalizeProduct = (p: Partial<ProductConfig> & Pick<ProductConfig, "key" | "label" | "bonusLabel">): ProductConfig => ({
  key: p.key,
  label: p.label,
  bonusLabel: p.bonusLabel,
  enabled: p.enabled !== false,
  priceDistributor: Number(p.priceDistributor) || 0,
  pricePharmacy: Number(p.pricePharmacy) || 0,
});

const mergeColumns = (stored: ColumnConfig[] | undefined, defaults: ColumnConfig[]) => {
  if (!Array.isArray(stored) || stored.length === 0) return defaults.map((c) => ({ ...c, scope: scopeOf(c) }));
  const normalized = stored.map((c) => ({ ...c, scope: scopeOf(c) }));
  const have = new Set(normalized.map((c) => c.key));
  return [...normalized, ...defaults.filter((c) => !have.has(c.key)).map((c) => ({ ...c, scope: scopeOf(c) }))];
};

export default function ColumnsPage() {
  const [cols, setCols] = useState<Record<string, ColumnConfig[]>>(DEFAULT_COLUMNS);
  const [products, setProducts] = useState<ProductConfig[]>(DEFAULT_PRODUCTS);
  const [tab, setTab] = useState("pharmacies");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});

  // افزودن ستون آماده
  const [addCol, setAddCol] = useState("");
  const [addScope, setAddScope] = useState<FieldScope>("both");

  // افزودن فیلد سفارشی
  const [customLabel, setCustomLabel] = useState("");
  const [customType, setCustomType] = useState<FieldType>("text");
  const [customScope, setCustomScope] = useState<FieldScope>("both");
  const [customRequired, setCustomRequired] = useState(false);

  // افزودن کالا
  const [newProduct, setNewProduct] = useState("");
  const confirm = useConfirm();

  const load = useCallback(async () => {
    const res = await fetch("/api/settings", { cache: "no-store" });
    if (!res.ok) return;
    const v = (await res.json()).values ?? {};
    const storedProducts = Array.isArray(v.products) ? (v.products as ProductConfig[]) : DEFAULT_PRODUCTS;
    setProducts(storedProducts.map(normalizeProduct));
    setCols({
      pharmacies: mergeColumns(v["columns.pharmacies"], DEFAULT_COLUMNS.pharmacies),
      doctors: mergeColumns(v["columns.doctors"], DEFAULT_COLUMNS.doctors),
      orders: mergeColumns(v["columns.orders"], DEFAULT_COLUMNS.orders),
    });
    setDirty({});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const current = cols[tab] ?? [];
  const available = useMemo(
    () => (AVAILABLE_COLUMNS[tab] ?? []).filter((a) => !current.some((c) => c.key === a.key)),
    [tab, current],
  );

  const setCurrent = (next: ColumnConfig[]) => {
    setCols((c) => ({ ...c, [tab]: next }));
    setDirty((d) => ({ ...d, [tab]: true }));
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= current.length) return;
    const next = [...current];
    [next[i], next[j]] = [next[j], next[i]];
    setCurrent(next);
  };

  const saveColumns = async () => {
    if (
      !(await confirm({
        title: "ذخیره فیلدها و ستون‌ها",
        message: "تنظیمات در فرم ثبت و لیست اعمال شود؟",
        confirmText: "ذخیره و اعمال",
      }))
    )
      return;
    setBusy(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: `columns.${tab}`, value: current }),
    });
    setBusy(false);
    if (res.ok) {
      setMsg("✅ ذخیره شد؛ فیلدهای جدید در فرم ثبت و/یا لیست اعمال شدند");
      setDirty((d) => ({ ...d, [tab]: false }));
    } else setMsg("✖ ذخیره تنظیمات ناموفق بود");
  };

  const addReadyColumn = () => {
    const found = available.find((a) => a.key === addCol);
    if (!found) return setMsg("✖ ابتدا یک ستون را انتخاب کنید");
    setCurrent([
      ...current,
      {
        ...found,
        visible: true,
        scope: addScope,
        fieldType: addScope === "list" ? undefined : "text",
      },
    ]);
    setAddCol("");
    setMsg(`✅ «${found.label}» اضافه شد؛ برای اعمال، دکمه ذخیره را بزنید`);
  };

  const addCustomField = () => {
    const label = customLabel.trim();
    if (label.length < 2) return setMsg("✖ نام فیلد سفارشی حداقل ۲ حرف باشد");
    const key = `custom_${Date.now().toString(36)}`;
    setCurrent([
      ...current,
      {
        key,
        label,
        visible: true,
        scope: customScope,
        fieldType: customType,
        custom: true,
        required: customRequired,
      },
    ]);
    setCustomLabel("");
    setCustomRequired(false);
    setMsg(`✅ فیلد سفارشی «${label}» اضافه شد؛ برای اعمال، ذخیره کنید`);
  };

  const saveProducts = async () => {
    if (
      !(await confirm({
        title: "ذخیره کالاها و قیمت‌ها",
        message: "عنوان‌ها، ترتیب، قیمت پخش و قیمت داروخانه ذخیره شوند؟ این قیمت‌ها در محاسبات تارگت استفاده می‌شوند.",
        confirmText: "ذخیره",
      }))
    )
      return;
    setBusy(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "products", value: products }),
    });
    setBusy(false);
    setMsg(res.ok ? "✅ کالاها و قیمت‌ها ذخیره شدند و در تارگت اعمال می‌شوند" : "✖ ذخیره کالاها ناموفق بود");
  };

  const money = (n: number) => toPersianDigits(Math.round(n).toLocaleString("en-US"));

  return (
    <div className="space-y-4">
      <SectionTitle icon="🧱">مدیریت فیلدها، ستون‌ها، کالاها و قیمت‌ها</SectionTitle>
      {msg ? <Alert kind={msg.startsWith("✖") ? "error" : "success"}>{msg}</Alert> : null}

      <Card>
        <div className="mb-4 flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 text-xs font-bold">
          {TABLES.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setAddCol("");
              }}
              className={`rounded-lg px-4 py-2 ${tab === t.key ? "bg-teal-600 text-white shadow" : "text-slate-600"}`}
            >
              {t.icon} {t.label} {dirty[t.key] ? "●" : ""}
            </button>
          ))}
        </div>

        <Alert kind="info">
          برای هر مورد مشخص کنید در <b>فرم ثبت</b>، <b>لیست</b> یا <b>هر دو</b> نمایش داده شود. فیلدهای سفارشی واقعاً
          همراه رکورد در دیتابیس ذخیره می‌شوند.
        </Alert>

        <div className="mt-3 space-y-1.5">
          {current.map((c, i) => (
            <div key={c.key} className="grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 sm:grid-cols-[34px_1fr_170px_130px_auto] sm:items-center">
              <span className="text-center text-[11px] text-slate-400">{toPersianDigits(i + 1)}</span>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="size-4 accent-teal-600"
                  checked={c.visible}
                  onChange={(e) => {
                    const next = [...current];
                    next[i] = { ...c, visible: e.target.checked };
                    setCurrent(next);
                  }}
                />
                <Input
                  value={c.label}
                  onChange={(e) => {
                    const next = [...current];
                    next[i] = { ...c, label: e.target.value };
                    setCurrent(next);
                  }}
                  className="px-2 py-1.5 text-xs"
                />
                {c.custom ? <Badge tone="amber">سفارشی</Badge> : <Badge tone="slate">سیستمی</Badge>}
              </div>
              <select
                value={scopeOf(c)}
                onChange={(e) => {
                  const next = [...current];
                  next[i] = { ...c, scope: e.target.value as FieldScope };
                  setCurrent(next);
                }}
                className="rounded-xl border border-slate-300 px-2 py-2 text-xs"
              >
                {Object.entries(SCOPE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              {c.custom ? (
                <select
                  value={c.fieldType ?? "text"}
                  onChange={(e) => {
                    const next = [...current];
                    next[i] = { ...c, fieldType: e.target.value as FieldType };
                    setCurrent(next);
                  }}
                  className="rounded-xl border border-slate-300 px-2 py-2 text-xs"
                >
                  {Object.entries(TYPE_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-[10px] text-slate-400" dir="ltr">
                  {c.key}
                </span>
              )}
              <div className="flex justify-end gap-1">
                <button onClick={() => move(i, -1)} className="rounded-lg bg-white px-2 py-1 text-xs ring-1 ring-slate-200">↑</button>
                <button onClick={() => move(i, 1)} className="rounded-lg bg-white px-2 py-1 text-xs ring-1 ring-slate-200">↓</button>
                <button
                  onClick={async () => {
                    if (!(await confirm({ title: "حذف فیلد/ستون", message: `«${c.label}» حذف شود؟`, confirmText: "حذف", danger: true }))) return;
                    setCurrent(current.filter((_, x) => x !== i));
                  }}
                  className="rounded-lg bg-rose-100 px-2 py-1 text-xs font-bold text-rose-700"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-2xl bg-sky-50 p-3 ring-1 ring-sky-200">
            <h3 className="mb-2 text-xs font-black text-sky-900">➕ افزودن فیلد/ستون آماده</h3>
            <div className="flex flex-wrap gap-2">
              <select value={addCol} onChange={(e) => setAddCol(e.target.value)} className="min-w-[180px] flex-1 rounded-xl border border-slate-300 px-2 py-2 text-xs">
                <option value="">انتخاب مورد...</option>
                {available.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
              </select>
              <select value={addScope} onChange={(e) => setAddScope(e.target.value as FieldScope)} className="rounded-xl border border-slate-300 px-2 py-2 text-xs">
                {Object.entries(SCOPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <Button variant="soft" onClick={addReadyColumn}>افزودن</Button>
            </div>
            <p className="mt-1 text-[10px] text-sky-700">{toPersianDigits(available.length)} مورد آماده قابل افزودن است.</p>
          </div>

          <div className="rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-200">
            <h3 className="mb-2 text-xs font-black text-amber-900">✨ ساخت فیلد کاملاً سفارشی</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Input value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="نام فیلد، مثلاً کد مشتری" />
              <select value={customType} onChange={(e) => setCustomType(e.target.value as FieldType)} className="rounded-xl border border-slate-300 px-2 py-2 text-xs">
                {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={customScope} onChange={(e) => setCustomScope(e.target.value as FieldScope)} className="rounded-xl border border-slate-300 px-2 py-2 text-xs">
                {Object.entries(SCOPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <label className="flex items-center gap-1 text-[11px] font-bold text-amber-900">
                <input type="checkbox" checked={customRequired} onChange={(e) => setCustomRequired(e.target.checked)} className="accent-amber-600" /> اجباری
              </label>
              <Button variant="soft" onClick={addCustomField}>ساخت فیلد</Button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={saveColumns} disabled={busy}>💾 ذخیره و اعمال در فرم/لیست</Button>
          <Button
            variant="ghost"
            onClick={async () => {
              if (!(await confirm({ title: "بازگردانی پیش‌فرض", message: "تنظیمات این بخش به حالت اولیه برگردد؟", confirmText: "بازگردانی" }))) return;
              setCurrent(DEFAULT_COLUMNS[tab].map((c) => ({ ...c, scope: scopeOf(c) })));
            }}
          >
            بازگردانی پیش‌فرض
          </Button>
          {dirty[tab] ? <Badge tone="amber">تغییرات ذخیره‌نشده</Badge> : <Badge tone="green">ذخیره‌شده</Badge>}
        </div>
      </Card>

      <Card>
        <h3 className="mb-1 text-sm font-black text-slate-800">💊 کالاها، جوایز و قیمت‌های مرجع</h3>
        <p className="mb-3 text-[11px] text-slate-500">
          قیمت پخش و داروخانه به ریال وارد شود. این قیمت‌ها مستقیماً در محاسبات تارگت هر نماینده استفاده می‌شوند.
        </p>
        <div className="scroll-x">
          <table className="w-full min-w-[940px] text-right text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                <th className="px-2 py-2">ردیف</th>
                <th className="px-2 py-2">فعال</th>
                <th className="px-2 py-2">نام کالا</th>
                <th className="px-2 py-2">عنوان جایزه</th>
                <th className="px-2 py-2">قیمت پخش (ریال)</th>
                <th className="px-2 py-2">قیمت داروخانه (ریال)</th>
                <th className="px-2 py-2">اختلاف</th>
                <th className="px-2 py-2">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.key} className="border-b border-slate-100">
                  <td className="px-2 py-2">{toPersianDigits(i + 1)}</td>
                  <td className="px-2 py-2">
                    <input
                      type="checkbox"
                      checked={p.enabled}
                      onChange={(e) => {
                        const next = [...products];
                        next[i] = { ...p, enabled: e.target.checked };
                        setProducts(next);
                      }}
                      className="size-4 accent-teal-600"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input value={p.label} onChange={(e) => { const next=[...products]; next[i]={...p,label:e.target.value}; setProducts(next); }} className="w-36 px-2 py-1.5 text-xs" />
                  </td>
                  <td className="px-2 py-2">
                    <Input value={p.bonusLabel} onChange={(e) => { const next=[...products]; next[i]={...p,bonusLabel:e.target.value}; setProducts(next); }} className="w-44 px-2 py-1.5 text-xs" />
                  </td>
                  <td className="px-2 py-2">
                    <Input inputMode="numeric" value={p.priceDistributor || ""} onChange={(e) => { const next=[...products]; next[i]={...p,priceDistributor:Number(e.target.value.replace(/\D/g,""))||0}; setProducts(next); }} className="w-32 px-2 py-1.5 text-center text-xs" />
                  </td>
                  <td className="px-2 py-2">
                    <Input inputMode="numeric" value={p.pricePharmacy || ""} onChange={(e) => { const next=[...products]; next[i]={...p,pricePharmacy:Number(e.target.value.replace(/\D/g,""))||0}; setProducts(next); }} className="w-32 px-2 py-1.5 text-center text-xs" />
                  </td>
                  <td className="px-2 py-2 font-bold text-teal-700">{money(Math.max(0, p.pricePharmacy - p.priceDistributor))}</td>
                  <td className="px-2 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => { const j=i-1;if(j<0)return;const n=[...products];[n[i],n[j]]=[n[j],n[i]];setProducts(n); }} className="rounded bg-white px-2 py-1 ring-1 ring-slate-200">↑</button>
                      <button onClick={() => { const j=i+1;if(j>=products.length)return;const n=[...products];[n[i],n[j]]=[n[j],n[i]];setProducts(n); }} className="rounded bg-white px-2 py-1 ring-1 ring-slate-200">↓</button>
                      <button
                        onClick={async () => {
                          if (!(await confirm({ title: "حذف کالا", message: `«${p.label}» حذف شود؟`, confirmText: "حذف", danger: true }))) return;
                          setProducts(products.filter((_, x) => x !== i));
                        }}
                        className="rounded bg-rose-100 px-2 py-1 font-bold text-rose-700"
                      >حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <Input value={newProduct} onChange={(e) => setNewProduct(e.target.value)} placeholder="نام کالای جدید..." className="max-w-[240px]" />
          <Button
            variant="soft"
            onClick={() => {
              const label = newProduct.trim();
              if (!label) return;
              setProducts([...products, normalizeProduct({ key: `p_${Date.now()}`, label, bonusLabel: `تعداد جایزه ${label}`, enabled: true })]);
              setNewProduct("");
            }}
          >
            ➕ افزودن کالا
          </Button>
          <Button onClick={saveProducts} disabled={busy}>💾 ذخیره کالاها و قیمت‌ها</Button>
          <Button variant="ghost" onClick={() => setProducts(DEFAULT_PRODUCTS)}>بازگردانی پیش‌فرض</Button>
        </div>
      </Card>
    </div>
  );
}
