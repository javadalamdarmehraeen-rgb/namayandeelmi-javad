"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Input, SectionTitle } from "@/components/ui";
import { OPTION_CATEGORIES } from "@/lib/constants";
import { useConfirm } from "@/components/Confirm";
import { useLive } from "@/lib/useLive";
import { toPersianDigits } from "@/lib/jalali";

type Opt = { id: number; category: string; value: string; parent: string; createdBy: string };

/** دسته‌های وابسته: شهر زیر استان، منطقه زیر شهر */
const PARENT_OF: Record<string, string> = { city: "province", region: "city" };
const SIMPLE = OPTION_CATEGORIES.filter((c) => !["province", "city", "region"].includes(c.key));

export default function OptionsScreen({ canDelete = false }: { canDelete?: boolean }) {
  const [rows, setRows] = useState<Opt[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<{ id: number; value: string } | null>(null);
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const confirm = useConfirm();

  const load = useCallback(async () => {
    const res = await fetch("/api/options", { cache: "no-store" });
    if (res.ok) setRows((await res.json()).rows ?? []);
  }, []);

  useLive(load, 20000);

  useEffect(() => {
    load();
  }, [load]);

  const byCat = useCallback(
    (cat: string, parent?: string) =>
      rows.filter(
        (r) =>
          r.category === cat &&
          (parent === undefined || r.parent === parent) &&
          (!q || r.value.toLowerCase().includes(q.toLowerCase())),
      ),
    [rows, q],
  );

  const provinces = useMemo(() => byCat("province"), [byCat]);
  const cities = useMemo(() => byCat("city", province), [byCat, province]);
  const regions = useMemo(() => byCat("region", city), [byCat, city]);

  const add = async (category: string, parent = "") => {
    const key = `${category}|${parent}`;
    const value = (draft[key] ?? "").trim();
    if (!value) return;
    const label = OPTION_CATEGORIES.find((c) => c.key === category)?.label ?? category;
    if (
      !(await confirm({
        title: "افزودن مقدار جدید",
        message: `«${value}» به لیست «${label}»${parent ? ` زیرمجموعه «${parent}»` : ""} اضافه شود؟`,
        confirmText: "افزودن",
      }))
    )
      return;
    const res = await fetch("/api/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, value, parent }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setDraft({ ...draft, [key]: "" });
      setMsg({
        kind: "success",
        text: d.duplicate ? "این مقدار از قبل وجود دارد" : "✅ افزوده شد و بلافاصله در همه فرم‌ها قابل انتخاب است",
      });
      load();
    } else setMsg({ kind: "error", text: d.error ?? "خطا در افزودن" });
  };

  const remove = async (id: number, value: string, extra = "") => {
    if (
      !(await confirm({
        title: "حذف مقدار",
        message: `«${value}» حذف شود؟${extra}`,
        confirmText: "حذف",
        danger: true,
      }))
    )
      return;
    const res = await fetch(`/api/options?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMsg({ kind: "success", text: "🗑 حذف شد" });
      load();
    } else setMsg({ kind: "error", text: "حذف ناموفق بود" });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const value = editing.value.trim();
    if (!value) return;
    if (!(await confirm({ title: "ذخیره ویرایش", message: `مقدار به «${value}» تغییر کند؟`, confirmText: "ذخیره" })))
      return;
    const res = await fetch("/api/options", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing.id, value }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg({ kind: "success", text: "✏️ ویرایش ذخیره شد" });
      setEditing(null);
      load();
    } else setMsg({ kind: "error", text: d.error ?? "ویرایش ناموفق" });
  };

  const ItemRow = ({ it, onSelect, selected, childCount }: {
    it: Opt;
    onSelect?: () => void;
    selected?: boolean;
    childCount?: number;
  }) =>
    editing?.id === it.id ? (
      <li className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1.5">
        <Input
          value={editing.value}
          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
          className="px-2 py-1 text-xs"
          autoFocus
        />
        <button onClick={saveEdit} className="rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white">
          ذخیره
        </button>
        <button
          onClick={() => setEditing(null)}
          className="rounded-lg bg-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700"
        >
          لغو
        </button>
      </li>
    ) : (
      <li
        className={`flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-sm ${
          selected ? "bg-teal-50 ring-1 ring-teal-300" : "bg-slate-50"
        }`}
      >
        <button
          onClick={onSelect}
          className={`min-w-0 flex-1 truncate text-right ${onSelect ? "cursor-pointer font-bold text-teal-800" : ""}`}
        >
          {selected ? "▸ " : ""}
          {it.value}
          {childCount !== undefined ? (
            <span className="mr-1 text-[10px] text-slate-400">({toPersianDigits(childCount)})</span>
          ) : null}
        </button>
        {canDelete ? (
          <span className="flex shrink-0 gap-1">
            <button
              onClick={() => setEditing({ id: it.id, value: it.value })}
              className="rounded-lg bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-700"
            >
              ✏️
            </button>
            <button
              onClick={() => remove(it.id, it.value, childCount ? " زیرمجموعه‌های آن بدون والد می‌مانند." : "")}
              className="rounded-lg bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700"
            >
              حذف
            </button>
          </span>
        ) : null}
      </li>
    );

  const AddBox = ({ cat, parent, ph, disabled }: { cat: string; parent: string; ph: string; disabled?: boolean }) => {
    const key = `${cat}|${parent}`;
    return (
      <div className="mb-2 flex gap-2">
        <Input
          value={draft[key] ?? ""}
          disabled={disabled}
          onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter") add(cat, parent);
          }}
          placeholder={ph}
        />
        <Button onClick={() => add(cat, parent)} disabled={disabled}>
          افزودن
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <SectionTitle icon="➕">افزودن مقادیر کشویی (بروزرسانی لحظه‌ای)</SectionTitle>
      {msg ? <Alert kind={msg.kind}>{msg.text}</Alert> : null}
      <Input placeholder="🔍 جستجو در مقادیر..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />

      <Card>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-black text-slate-800">🗺 استان ← شهر ← منطقه (مرتبط)</h3>
          <span className="text-[11px] text-slate-500">
            روی استان بزنید تا شهرهای آن نمایش داده شود؛ روی شهر بزنید تا مناطقش دیده شود.
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
            <h4 className="mb-2 text-xs font-black text-slate-700">
              استان‌ها <Badge tone="slate">{toPersianDigits(provinces.length)}</Badge>
            </h4>
            <AddBox cat="province" parent="" ph="نام استان جدید..." />
            <ul className="max-h-72 space-y-1 overflow-y-auto">
              {provinces.map((p) => (
                <ItemRow
                  key={p.id}
                  it={p}
                  selected={province === p.value}
                  childCount={rows.filter((r) => r.category === "city" && r.parent === p.value).length}
                  onSelect={() => {
                    setProvince(province === p.value ? "" : p.value);
                    setCity("");
                  }}
                />
              ))}
              {provinces.length === 0 ? <li className="text-xs text-slate-400">استانی ثبت نشده</li> : null}
            </ul>
          </div>

          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
            <h4 className="mb-2 text-xs font-black text-slate-700">
              شهرهای {province || "—"} <Badge tone="slate">{toPersianDigits(cities.length)}</Badge>
            </h4>
            {!province ? (
              <Alert kind="info">ابتدا یک استان را انتخاب کنید</Alert>
            ) : (
              <>
                <AddBox cat="city" parent={province} ph={`شهر جدید در ${province}...`} />
                <ul className="max-h-72 space-y-1 overflow-y-auto">
                  {cities.map((c) => (
                    <ItemRow
                      key={c.id}
                      it={c}
                      selected={city === c.value}
                      childCount={rows.filter((r) => r.category === "region" && r.parent === c.value).length}
                      onSelect={() => setCity(city === c.value ? "" : c.value)}
                    />
                  ))}
                  {cities.length === 0 ? <li className="text-xs text-slate-400">شهری ثبت نشده</li> : null}
                </ul>
              </>
            )}
          </div>

          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
            <h4 className="mb-2 text-xs font-black text-slate-700">
              مناطق {city || "—"} <Badge tone="slate">{toPersianDigits(regions.length)}</Badge>
            </h4>
            {!city ? (
              <Alert kind="info">ابتدا یک شهر را انتخاب کنید</Alert>
            ) : (
              <>
                <AddBox cat="region" parent={city} ph={`منطقه جدید در ${city}...`} />
                <ul className="max-h-72 space-y-1 overflow-y-auto">
                  {regions.map((r) => (
                    <ItemRow key={r.id} it={r} />
                  ))}
                  {regions.length === 0 ? <li className="text-xs text-slate-400">منطقه‌ای ثبت نشده</li> : null}
                </ul>
              </>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SIMPLE.map((cat) => {
          const items = byCat(cat.key);
          return (
            <Card key={cat.key}>
              <h3 className="mb-2 text-sm font-bold text-slate-800">
                {cat.label} <span className="text-xs text-slate-400">({toPersianDigits(items.length)})</span>
              </h3>
              <AddBox cat={cat.key} parent="" ph="مقدار جدید..." />
              <ul className="max-h-60 space-y-1 overflow-y-auto">
                {items.map((it) => (
                  <ItemRow key={it.id} it={it} />
                ))}
                {items.length === 0 ? <li className="text-xs text-slate-400">موردی نیست</li> : null}
              </ul>
            </Card>
          );
        })}
      </div>
      {/* PARENT_OF برای مرجع ساختار سلسله‌مراتبی */}
      <span className="hidden">{Object.keys(PARENT_OF).join(",")}</span>
    </div>
  );
}
