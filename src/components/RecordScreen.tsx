"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamicImport from "next/dynamic";
import JalaliDateInput from "./JalaliDateInput";
import Combobox from "./Combobox";
import LocationPicker, { type LatLng } from "./LocationPicker";
import FileUploader, { FileList, type Att } from "./FileUploader";
import ShareBox from "./ShareBox";
import NavButton from "./NavButton";
import { Alert, Badge, Button, Card, Field, Input, SectionTitle, TextArea } from "./ui";
import {
  DEFAULT_PRODUCTS,
  DEFAULT_COLUMNS,
  bonusKeyOf,
  type ProductConfig,
  type ColumnConfig,
} from "@/lib/defaults";
import { isValidJalali, tehranDateTime, toPersianDigits, todayJalali } from "@/lib/jalali";
import { useConfirm } from "@/components/Confirm";
import { useLive } from "@/lib/useLive";
import { downloadFile } from "@/lib/download";

const MapBox = dynamicImport(() => import("./MapBox"), { ssr: false });

export type RecordType = "pharmacies" | "doctors" | "orders";

export type Row = {
  id: number;
  repName: string;
  dateShamsi: string;
  province?: string;
  city?: string;
  region?: string;
  name?: string;
  landline?: string;
  pharmacyName?: string;
  managerName?: string;
  managerPhone?: string;
  specialty?: string;
  phone?: string;
  secretaryName?: string;
  secretaryPhone?: string;
  otherAddresses?: string;
  address?: string;
  isPercent?: boolean;
  percentValue?: string;
  lat?: number | null;
  lng?: number | null;
  accuracy?: number | null;
  locationLabel?: string;
  items?: Record<string, number>;
  distributor?: string;
  visitor?: string;
  notes?: string;
  sent?: boolean;
  sendStatus?: string;
  createdAt?: string;
};

type Form = Record<string, string> & { items?: never };

type DupRow = {
  id: number;
  name: string;
  specialty?: string;
  phone?: string;
  city?: string;
  province?: string;
  region?: string;
  landline?: string;
  managerName?: string;
  managerPhone?: string;
  address?: string;
  lat?: number | null;
  lng?: number | null;
  accuracy?: number | null;
  isPercent?: boolean;
  percentValue?: string;
  repName: string;
  dateShamsi: string;
  mine: boolean;
};

type OrderHistory = {
  orderCount: number;
  lastDate: string;
  lastRep: string;
  totalUnits: number;
  totalBonus: number;
  items: { key: string; label: string; qty: number; bonus: number }[];
  recent: { id: number; dateShamsi: string; repName: string; units: number }[];
};

type TargetRow = {
  productKey: string;
  productLabel: string;
  quantity: number;
  sold: number;
  remaining: number;
  percent: number;
};

const emptyForm = (): Record<string, string> => ({
  dateShamsi: todayJalali(),
  province: "",
  city: "",
  region: "",
  name: "",
  landline: "",
  pharmacyName: "",
  managerName: "",
  managerPhone: "",
  address: "",
  specialty: "",
  phone: "",
  secretaryName: "",
  secretaryPhone: "",
  otherAddresses: "",
  distributor: "",
  visitor: "",
  notes: "",
});

const TITLES: Record<RecordType, { title: string; icon: string; nameLabel: string }> = {
  pharmacies: { title: "ثبت اطلاعات داروخانه", icon: "🏥", nameLabel: "نام داروخانه" },
  doctors: { title: "ثبت اطلاعات پزشک", icon: "🩺", nameLabel: "نام پزشک" },
  orders: { title: "ثبت سفارشات داروخانه", icon: "🧾", nameLabel: "نام داروخانه" },
};

const PAGE = 25;

export default function RecordScreen({ type, isAdmin = false }: { type: RecordType; isAdmin?: boolean }) {
  const meta = TITLES[type];
  const [tab, setTab] = useState<"form" | "list">(isAdmin ? "list" : "form");
  const [form, setForm] = useState<Record<string, string>>(emptyForm);
  const [items, setItems] = useState<Record<string, number>>({});
  const [loc, setLoc] = useState<LatLng>({ lat: null, lng: null, accuracy: null });
  const [rows, setRows] = useState<Row[]>([]);
  const [opts, setOpts] = useState<Record<string, string[]>>({});
  const [optTree, setOptTree] = useState<Record<string, Record<string, string[]>>>({});
  const [msg, setMsg] = useState<{ kind: "error" | "success" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [detail, setDetail] = useState<Row | null>(null);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<ProductConfig[]>(DEFAULT_PRODUCTS);
  const [isPercent, setIsPercent] = useState(false);
  const [percentValue, setPercentValue] = useState("");
  const [fileIds, setFileIds] = useState<number[]>([]);
  const [detailFiles, setDetailFiles] = useState<Att[]>([]);
  const [dupes, setDupes] = useState<DupRow[]>([]);
  const [history, setHistory] = useState<OrderHistory | null>(null);
  const [suggestion, setSuggestion] = useState<Record<string, unknown> | null>(null);
  const [autofilled, setAutofilled] = useState(false);
  const [targets, setTargets] = useState<TargetRow[]>([]);
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, string>>({});
  const [editItems, setEditItems] = useState<Record<string, number>>({});
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS[type]);

  const confirm = useConfirm();
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const loadRows = useCallback(async () => {
    const res = await fetch(`/api/records/${type}`, { cache: "no-store" });
    if (res.ok) setRows((await res.json()).rows ?? []);
  }, [type]);

  const loadOptions = useCallback(async () => {
    const res = await fetch("/api/options", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    const rows = (data.rows ?? []) as { category: string; value: string; parent?: string }[];
    const grouped: Record<string, string[]> = {};
    const tree: Record<string, Record<string, string[]>> = {};
    for (const o of rows) {
      (grouped[o.category] ??= []).push(o.value);
      const par = o.parent ?? "";
      ((tree[o.category] ??= {})[par] ??= []).push(o.value);
    }
    setOpts(grouped);
    setOptTree(tree);
  }, []);

  const loadSettings = useCallback(async () => {
    const res = await fetch("/api/settings", { cache: "no-store" });
    if (!res.ok) return;
    const d = await res.json();
    const v = d.values ?? {};
    setProducts((v.products as ProductConfig[])?.filter((p) => p.enabled) ?? DEFAULT_PRODUCTS);
    setColumns((v[`columns.${type}`] as ColumnConfig[]) ?? DEFAULT_COLUMNS[type]);
  }, [type]);

  useEffect(() => {
    loadOptions();
    loadSettings();
  }, [loadOptions, loadSettings]);

  // بروزرسانی لحظه‌ای لیست بدون نیاز به رفرش دستی
  useLive(loadRows, 15000, tab === "list");

  const recordName = type === "orders" ? form.pharmacyName : form.name;

  const submit = async () => {
    if (!isValidJalali(form.dateShamsi)) {
      setMsg({ kind: "error", text: "تاریخ شمسی معتبر نیست (نمونه: ۱۴۰۵/۰۱/۰۱)" });
      return;
    }
    if (!recordName.trim()) {
      setMsg({ kind: "error", text: `${meta.nameLabel} الزامی است` });
      return;
    }
    // هشدار تکراری بودن پیش از ثبت
    if (type !== "orders" && dupes.length > 0) {
      const ok = await confirm({
        title: "⚠️ رکورد تکراری",
        message:
          `«${dupes[0].name}» قبلاً ${dupes[0].mine ? "توسط خودتان" : `توسط ${dupes[0].repName}`} در تاریخ ` +
          `${toPersianDigits(dupes[0].dateShamsi)} ثبت شده است.\nآیا مطمئنید می‌خواهید دوباره ثبت کنید؟`,
        confirmText: "بله، ثبت کن",
        cancelText: "انصراف",
        danger: true,
      });
      if (!ok) return;
    }
    if (
      !(await confirm({
        title: "ثبت اطلاعات",
        message: `«${recordName.trim()}» با تاریخ ${toPersianDigits(form.dateShamsi)} ثبت شود؟`,
        confirmText: "ثبت کن",
      }))
    )
      return;
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/records/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        items,
        isPercent,
        percentValue,
        fileIds,
        lat: loc.lat,
        lng: loc.lng,
        accuracy: loc.accuracy,
        locationLabel: recordName.trim(),
      }),
    });
    setBusy(false);
    if (res.ok) {
      setForm(emptyForm());
      setItems({});
      setIsPercent(false);
      setPercentValue("");
      setFileIds([]);
      setLoc({ lat: null, lng: null, accuracy: null });
      setMsg({ kind: "success", text: "✅ ثبت شد. برای ارسال به مدیر به تب «لیست ثبت‌شده‌ها» بروید." });
      setDupes([]);
      setHistory(null);
      loadRows();
      loadTargets();
      setTab("list");
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg({ kind: "error", text: d.error ?? "خطا در ثبت اطلاعات" });
    }
  };

  const sendSelected = async () => {
    const ids = selected.length ? selected : rows.filter((r) => !r.sent).map((r) => r.id);
    if (!ids.length) {
      setMsg({ kind: "info", text: "رکورد ارسال‌نشده‌ای وجود ندارد" });
      return;
    }
    if (
      !(await confirm({
        title: "ارسال اطلاعات به مدیر",
        message: `${toPersianDigits(ids.length)} رکورد ارسال شود؟${type === "orders" ? " سفارش‌ها به پیام‌رسان‌های فعال هم ارسال می‌شوند." : ""}`,
        confirmText: "ارسال",
      }))
    )
      return;
    setBusy(true);
    const res = await fetch(`/api/records/${type}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setBusy(false);
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setSelected([]);
      setMsg({
        kind: "success",
        text:
          type === "orders"
            ? `📤 ارسال شد. وضعیت پیام‌رسان: ${d.status ?? "—"}`
            : `📤 ${toPersianDigits(ids.length)} رکورد برای مدیر ارسال شد`,
      });
      loadRows();
    } else setMsg({ kind: "error", text: d.error ?? "خطا در ارسال اطلاعات" });
  };

  const periods = useMemo(() => {
    const s = new Set(rows.map((r) => r.dateShamsi.slice(0, 7)).filter(Boolean));
    return [...s].sort().reverse();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (period && !r.dateShamsi.startsWith(period)) return false;
      if (!q) return true;
      const hay = `${r.repName} ${r.name ?? ""} ${r.pharmacyName ?? ""} ${r.managerName ?? ""} ${r.specialty ?? ""} ${r.city ?? ""} ${r.province ?? ""} ${r.managerPhone ?? ""} ${r.phone ?? ""}`;
      return hay.toLowerCase().includes(q);
    });
  }, [rows, search, period]);

  const pageRows = filtered.slice(0, page * PAGE);

  useEffect(() => {
    if (detail && type !== "orders") {
      const ot = type === "doctors" ? "doctor" : "pharmacy";
      fetch(`/api/attachments?ownerType=${ot}&ownerId=${detail.id}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setDetailFiles(d?.rows ?? []))
        .catch(() => setDetailFiles([]));
    } else setDetailFiles([]);
  }, [detail, type]);

  const orderText = (r: Row) => {
    const lines = [
      "🧾 سفارش داروخانه",
      `تاریخ سفارش: ${toPersianDigits(r.dateShamsi)}`,
      `نماینده علمی: ${r.repName}`,
      `نام داروخانه: ${r.pharmacyName ?? ""}`,
      `مسئول سفارش: ${r.managerName ?? ""}`,
      `شماره همراه: ${toPersianDigits(r.managerPhone ?? "")}`,
      `آدرس: ${r.address ?? ""}`,
    ];
    // در ارسال دستی، لوکیشن درج نمی‌شود (طبق درخواست)
    lines.push("— اقلام سفارش —");
    for (const p of products) {
      const q = Number(r.items?.[p.key] ?? 0);
      const b = Number(r.items?.[bonusKeyOf(p.key)] ?? 0);
      if (q || b) lines.push(`${p.label}: ${toPersianDigits(q)} | جایزه: ${toPersianDigits(b)}`);
    }
    lines.push(`نام پخش: ${r.distributor ?? ""}`);
    lines.push(`نام ویزیتور: ${r.visitor ?? ""}`);
    if (r.notes) lines.push(`توضیحات: ${r.notes}`);
    return lines.join("\n");
  };

  /* ---- بارگذاری تارگت‌ها برای نمایش کنار هر کالا ---- */
  const loadTargets = useCallback(async () => {
    if (type !== "orders") return;
    const res = await fetch("/api/targets", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setTargets(d.progress ?? []);
    }
  }, [type]);

  useEffect(() => {
    loadTargets();
  }, [loadTargets]);

  /* ---- تشخیص تکراری + پرکردن خودکار از سابقه ---- */
  const lookupName = type === "orders" ? form.pharmacyName : form.name;
  const lookupPhone = type === "doctors" ? form.phone : form.managerPhone;

  useEffect(() => {
    if (tab !== "form") return;
    const n = (lookupName ?? "").trim();
    if (n.length < 2) {
      setDupes([]);
      setHistory(null);
      setSuggestion(null);
      return;
    }
    const t = setTimeout(async () => {
      const q = new URLSearchParams({ type, name: n, phone: lookupPhone ?? "" });
      const res = await fetch(`/api/records/lookup?${q}`, { cache: "no-store" }).catch(() => null);
      if (!res?.ok) return;
      const d = await res.json();
      setDupes(d.duplicates ?? []);
      setHistory(d.history ?? null);
      setSuggestion(d.suggestion ?? null);
    }, 600);
    return () => clearTimeout(t);
  }, [lookupName, lookupPhone, type, tab]);

  /** پرکردن خودکار فیلدها از سابقه داروخانه */
  const applySuggestion = (src?: Record<string, unknown> | DupRow) => {
    const s = (src ?? suggestion) as Record<string, unknown> | null;
    if (!s) return;
    setForm((f) => ({
      ...f,
      pharmacyName: String(s.pharmacyName ?? s.name ?? f.pharmacyName),
      name: type === "orders" ? f.name : String(s.name ?? f.name),
      managerName: String(s.managerName ?? f.managerName),
      managerPhone: String(s.managerPhone ?? f.managerPhone),
      address: String(s.address ?? f.address),
      province: String(s.province ?? f.province),
      city: String(s.city ?? f.city),
      region: String(s.region ?? f.region),
      landline: String(s.landline ?? f.landline),
      distributor: String(s.distributor ?? f.distributor),
      visitor: String(s.visitor ?? f.visitor),
    }));
    const la = Number(s.lat);
    const ln = Number(s.lng);
    if (Number.isFinite(la) && Number.isFinite(ln) && la && ln) {
      setLoc({ lat: la, lng: ln, accuracy: Number(s.accuracy) || null });
    }
    setAutofilled(true);
    setTimeout(() => setAutofilled(false), 4000);
  };

  /* ---------- ویرایش و حذف رکورد ---------- */
  const openEdit = (r: Row) => {
    setEditRow(r);
    setEditDraft({
      dateShamsi: r.dateShamsi ?? "",
      name: r.name ?? "",
      pharmacyName: r.pharmacyName ?? "",
      province: r.province ?? "",
      city: r.city ?? "",
      region: r.region ?? "",
      landline: r.landline ?? "",
      managerName: r.managerName ?? "",
      managerPhone: r.managerPhone ?? "",
      specialty: r.specialty ?? "",
      phone: r.phone ?? "",
      secretaryName: r.secretaryName ?? "",
      secretaryPhone: r.secretaryPhone ?? "",
      address: r.address ?? "",
      otherAddresses: r.otherAddresses ?? "",
      distributor: r.distributor ?? "",
      visitor: r.visitor ?? "",
      notes: r.notes ?? "",
      percentValue: r.percentValue ?? "",
    });
    setEditItems({ ...(r.items ?? {}) });
  };

  const saveEdit = async () => {
    if (!editRow) return;
    if (
      !(await confirm({
        title: "ذخیره ویرایش",
        message: `تغییرات «${editDraft.pharmacyName || editDraft.name}» ذخیره شود؟`,
        confirmText: "ذخیره",
      }))
    )
      return;
    setBusy(true);
    const res = await fetch(`/api/records/${type}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editRow.id, ...editDraft, ...(type === "orders" ? { items: editItems } : {}) }),
    });
    setBusy(false);
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg({ kind: "success", text: "✅ ویرایش ذخیره شد" });
      setEditRow(null);
      loadRows();
      loadTargets();
    } else setMsg({ kind: "error", text: d.error ?? "خطا در ویرایش" });
  };

  const removeRow = async (r: Row) => {
    if (
      !(await confirm({
        title: "حذف رکورد",
        message: `«${nameOf(r)}» برای همیشه حذف شود؟ این عمل قابل بازگشت نیست.`,
        confirmText: "حذف",
        danger: true,
      }))
    )
      return;
    const res = await fetch(`/api/records/${type}?id=${r.id}`, { method: "DELETE" });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg({ kind: "success", text: "🗑 رکورد حذف شد" });
      loadRows();
      loadTargets();
    } else setMsg({ kind: "error", text: d.error ?? "حذف ناموفق بود" });
  };

  const onAdded = () => loadOptions();

  const visibleCols = columns.filter((c) => c.visible);

  const nameOf = (r: Row) => (type === "orders" ? r.pharmacyName : r.name) ?? "";

  const renderCell = (key: string, r: Row, i: number) => {
    switch (key) {
      case "row":
        return (
          <div className="flex items-center gap-2">
            {!isAdmin ? (
              <input
                type="checkbox"
                className="size-4 accent-teal-600"
                checked={selected.includes(r.id)}
                onChange={(e) => setSelected((s) => (e.target.checked ? [...s, r.id] : s.filter((x) => x !== r.id)))}
              />
            ) : null}
            {toPersianDigits(i + 1)}
          </div>
        );
      case "repName":
        return <span className="font-semibold text-slate-700">{r.repName}</span>;
      case "dateShamsi":
        return toPersianDigits(r.dateShamsi);
      case "name":
      case "pharmacyName":
        return (
          <button
            onClick={() => setDetail(r)}
            className="font-bold text-teal-700 underline decoration-dotted underline-offset-4"
          >
            {nameOf(r)}
          </button>
        );
      case "location":
        return r.lat && r.lng ? (
          <Badge tone="green">{r.accuracy ? `${toPersianDigits(Math.round(r.accuracy))}م` : "ثبت"}</Badge>
        ) : (
          <Badge tone="amber">ندارد</Badge>
        );
      case "sent":
        return r.sent ? <Badge tone="green">ارسال شد</Badge> : <Badge tone="amber">در انتظار</Badge>;
      case "nav":
        return <NavButton lat={r.lat} lng={r.lng} label={nameOf(r)} />;
      case "actions":
        return (
          <div className="flex gap-1">
            <button
              onClick={() => openEdit(r)}
              className="rounded-lg bg-sky-100 px-2 py-1 text-[10px] font-bold text-sky-700"
              title="ویرایش"
            >
              ✏️ ویرایش
            </button>
            <button
              onClick={() => removeRow(r)}
              className="rounded-lg bg-rose-100 px-2 py-1 text-[10px] font-bold text-rose-700"
              title="حذف"
            >
              🗑 حذف
            </button>
          </div>
        );
      case "totalUnits":
        return toPersianDigits(products.reduce((a, p) => a + Number(r.items?.[p.key] ?? 0), 0));
      case "totalBonus":
        return toPersianDigits(products.reduce((a, p) => a + Number(r.items?.[bonusKeyOf(p.key)] ?? 0), 0));
      case "files":
        return (
          <button onClick={() => setDetail(r)} className="text-[11px] font-bold text-sky-700 underline">
            📎 مشاهده
          </button>
        );
      case "createdAt":
        return <span className="text-[10px] text-slate-500">{r.createdAt ? tehranDateTime(r.createdAt) : "—"}</span>;
      case "percentValue":
        return r.percentValue || "—";
      case "isPercent":
        return r.isPercent ? (
          <Badge tone="green">بله{r.percentValue ? ` (${r.percentValue})` : ""}</Badge>
        ) : (
          <Badge tone="slate">خیر</Badge>
        );
      case "products":
        return (
          <span className="text-[11px] text-slate-600">
            {products
              .filter((p) => (r.items?.[p.key] ?? 0) || (r.items?.[bonusKeyOf(p.key)] ?? 0))
              .map(
                (p) =>
                  `${p.label}: ${toPersianDigits(r.items?.[p.key] ?? 0)}+${toPersianDigits(r.items?.[bonusKeyOf(p.key)] ?? 0)}`,
              )
              .join(" | ") || "—"}
          </span>
        );
      case "managerPhone":
      case "phone":
      case "secretaryPhone":
      case "landline":
        return toPersianDigits((r as unknown as Record<string, string>)[key] ?? "") || "—";
      default: {
        const v = (r as unknown as Record<string, unknown>)[key];
        return v ? String(v) : "—";
      }
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle icon={meta.icon}>{meta.title}</SectionTitle>
        <div className="flex rounded-xl bg-slate-200 p-1 text-xs font-bold">
          <button
            onClick={() => setTab("form")}
            className={`rounded-lg px-3 py-1.5 ${tab === "form" ? "bg-white text-teal-700 shadow" : "text-slate-600"}`}
          >
            فرم ثبت
          </button>
          <button
            onClick={() => setTab("list")}
            className={`rounded-lg px-3 py-1.5 ${tab === "list" ? "bg-white text-teal-700 shadow" : "text-slate-600"}`}
          >
            لیست ({toPersianDigits(rows.length)})
          </button>
        </div>
      </div>

      {msg ? <Alert kind={msg.kind}>{msg.text}</Alert> : null}

      {tab === "form" ? (
        <Card>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={type === "orders" ? "تاریخ سفارش" : "تاریخ ثبت"} required hint="تایپ با درج خودکار اسلش یا انتخاب از تقویم">
              <JalaliDateInput value={form.dateShamsi} onChange={(v) => set("dateShamsi", v)} />
            </Field>

            {type !== "orders" ? (
              <>
                <Field label="نام استان" required hint="۳۱ استان کشور — فقط انتخاب کنید">
                  <Combobox
                    value={form.province}
                    onChange={(v) => {
                      set("province", v);
                      if (v !== form.province) {
                        set("city", "");
                        set("region", "");
                      }
                    }}
                    options={opts.province ?? []}
                    selectOnly
                    placeholder="انتخاب استان..."
                  />
                </Field>
                <Field label="شهر" hint="شهرهای همان استان — فقط انتخاب کنید">
                  <Combobox
                    value={form.city}
                    onChange={(v) => {
                      set("city", v);
                      if (v !== form.city) set("region", "");
                    }}
                    options={optTree.city?.[form.province] ?? []}
                    selectOnly
                    parent={form.province}
                    parentLabel="استان"
                    requireParent
                    placeholder="انتخاب شهر..."
                  />
                </Field>
                <Field label="منطقه" hint="مناطق همان شهر — فقط انتخاب کنید">
                  <Combobox
                    value={form.region}
                    onChange={(v) => set("region", v)}
                    options={optTree.region?.[form.city] ?? []}
                    selectOnly
                    parent={form.city}
                    parentLabel="شهر"
                    requireParent
                    placeholder="انتخاب منطقه..."
                  />
                </Field>
              </>
            ) : null}

            {type === "doctors" ? (
              <>
                <Field label="نام پزشک" required hint="قابل تایپ + افزودن لحظه‌ای">
                  <Combobox
                    value={form.name}
                    onChange={(v) => set("name", v)}
                    options={opts.doctor ?? []}
                    category="doctor"
                    onAdded={onAdded}
                    placeholder="دکتر ..."
                  />
                </Field>
                <Field label="تخصص" hint="کشویی + جستجوی پیشرفته + افزودن لحظه‌ای">
                  <Combobox
                    value={form.specialty}
                    onChange={(v) => set("specialty", v)}
                    options={opts.specialty ?? []}
                    category="specialty"
                    onAdded={onAdded}
                  />
                </Field>
                <Field label="شماره همراه پزشک">
                  <Input inputMode="numeric" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </Field>
                <Field label="نام منشی">
                  <Combobox
                    value={form.secretaryName}
                    onChange={(v) => set("secretaryName", v)}
                    options={opts.secretary ?? []}
                    category="secretary"
                    onAdded={onAdded}
                  />
                </Field>
                <Field label="شماره همراه منشی">
                  <Input
                    inputMode="numeric"
                    value={form.secretaryPhone}
                    onChange={(e) => set("secretaryPhone", e.target.value)}
                  />
                </Field>
                <div className="sm:col-span-2 lg:col-span-3">
                  <Field label="آدرس مطب">
                    <TextArea value={form.address} onChange={(e) => set("address", e.target.value)} />
                  </Field>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <Field label="آدرس مطب‌های دیگر">
                    <TextArea
                      value={form.otherAddresses}
                      onChange={(e) => set("otherAddresses", e.target.value)}
                      placeholder="هر آدرس در یک خط"
                    />
                  </Field>
                </div>
              </>
            ) : (
              <>
                <Field label="نام داروخانه" required hint="قابل تایپ + افزودن لحظه‌ای">
                  <Combobox
                    value={type === "orders" ? form.pharmacyName : form.name}
                    onChange={(v) => set(type === "orders" ? "pharmacyName" : "name", v)}
                    options={opts.pharmacy ?? []}
                    category="pharmacy"
                    onAdded={onAdded}
                  />
                </Field>
                {type === "pharmacies" ? (
                  <Field label="شماره ثابت داروخانه">
                    <Input inputMode="numeric" value={form.landline} onChange={(e) => set("landline", e.target.value)} placeholder="۰۲۱..." />
                  </Field>
                ) : null}
                <Field label="نام مسئول سفارش">
                  <Combobox
                    value={form.managerName}
                    onChange={(v) => set("managerName", v)}
                    options={opts.manager ?? []}
                    category="manager"
                    onAdded={onAdded}
                  />
                </Field>
                <Field label="شماره همراه مسئول سفارش">
                  <Input
                    inputMode="numeric"
                    value={form.managerPhone}
                    onChange={(e) => set("managerPhone", e.target.value)}
                  />
                </Field>
                <div className="sm:col-span-2 lg:col-span-3">
                  <Field label="آدرس داروخانه">
                    <TextArea value={form.address} onChange={(e) => set("address", e.target.value)} />
                  </Field>
                </div>
              </>
            )}
          </div>

          {/* ---------- هشدار تکراری بودن ---------- */}
          {dupes.length > 0 ? (
            <div className="mt-3 rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-300">
              <div className="mb-1 text-xs font-black text-amber-900">
                ⚠️ {type === "doctors" ? "این پزشک قبلاً ثبت شده است" : "این داروخانه قبلاً ثبت شده است"} (
                {toPersianDigits(dupes.length)} مورد)
              </div>
              <div className="space-y-1">
                {dupes.map((d) => (
                  <div key={d.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-2 py-1.5 text-[11px]">
                    <span className="font-bold text-slate-800">{d.name}</span>
                    {d.specialty ? <span className="text-slate-500">{d.specialty}</span> : null}
                    {d.city ? <span className="text-slate-500">{d.city}</span> : null}
                    {d.managerPhone || d.phone ? (
                      <span className="text-slate-500">{toPersianDigits(d.managerPhone || d.phone || "")}</span>
                    ) : null}
                    <Badge tone={d.mine ? "green" : "amber"}>
                      {d.mine ? "ثبت خودتان" : `ثبت ${d.repName}`}
                    </Badge>
                    <span className="text-slate-400">{toPersianDigits(d.dateShamsi)}</span>
                    {type !== "doctors" ? (
                      <button
                        type="button"
                        onClick={() => applySuggestion(d)}
                        className="mr-auto rounded-lg bg-teal-600 px-2 py-1 text-[10px] font-bold text-white"
                      >
                        استفاده از این اطلاعات
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
              <p className="mt-1 text-[10px] text-amber-800">
                اگر مطمئن هستید مورد جدیدی است، می‌توانید ادامه دهید؛ در غیر این صورت از ثبت تکراری خودداری کنید.
              </p>
            </div>
          ) : null}

          {/* ---------- سابقه سفارش داروخانه ---------- */}
          {type === "orders" && history && history.orderCount > 0 ? (
            <div className="mt-3 rounded-2xl bg-sky-50 p-3 ring-1 ring-sky-300">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-sky-900">
                  📊 سابقه این داروخانه: {toPersianDigits(history.orderCount)} سفارش
                </span>
                <Badge tone="green">جمع کالا: {toPersianDigits(history.totalUnits)}</Badge>
                <Badge tone="amber">جمع جایزه: {toPersianDigits(history.totalBonus)}</Badge>
                {history.lastDate ? (
                  <span className="text-[11px] text-sky-800">
                    آخرین سفارش: {toPersianDigits(history.lastDate)} توسط {history.lastRep}
                  </span>
                ) : null}
                {suggestion ? (
                  <button
                    type="button"
                    onClick={() => applySuggestion()}
                    className="mr-auto rounded-lg bg-sky-700 px-2 py-1 text-[10px] font-bold text-white"
                  >
                    📥 پرکردن خودکار فیلدها
                  </button>
                ) : null}
              </div>
              {history.items.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {history.items.map((it) => (
                    <span key={it.key} className="rounded-lg bg-white px-2 py-1 text-[10px] text-slate-700 ring-1 ring-sky-200">
                      {it.label}: <b>{toPersianDigits(it.qty)}</b>
                      {it.bonus ? <span className="text-emerald-600"> +{toPersianDigits(it.bonus)}</span> : null}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {autofilled ? (
            <div className="mt-2">
              <Alert kind="success">✅ اطلاعات از سابقه این داروخانه پر شد — در صورت نیاز ویرایش کنید.</Alert>
            </div>
          ) : null}

          {type === "orders" && targets.some((t) => t.quantity > 0) ? (
            <div className="mt-4 rounded-2xl bg-teal-50 p-3 ring-1 ring-teal-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-teal-900">🎯 تارگت شما در این ماه</span>
                {(() => {
                  const tq = targets.reduce((a, t) => a + t.quantity, 0);
                  const ts = targets.reduce((a, t) => a + t.sold, 0);
                  const typed = products.reduce((a, p) => a + Number(items[p.key] ?? 0), 0);
                  const pc = tq > 0 ? Math.round((ts / tq) * 100) : 0;
                  return (
                    <>
                      <Badge tone="slate">تارگت کل: {toPersianDigits(tq)}</Badge>
                      <Badge tone="green">فاکتور شده: {toPersianDigits(ts)}</Badge>
                      <Badge tone="amber">باقیمانده: {toPersianDigits(Math.max(0, tq - ts - typed))}</Badge>
                      {typed > 0 ? <Badge tone="green">این سفارش: {toPersianDigits(typed)}</Badge> : null}
                      <span className="mr-auto text-[11px] font-black text-teal-800">تحقق {toPersianDigits(pc)}٪</span>
                    </>
                  );
                })()}
              </div>
            </div>
          ) : null}

          {type === "orders" ? (
            <div className="mt-4">
              <SectionTitle icon="💊">اقلام سفارش</SectionTitle>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((p) => {
                  const tg = targets.find((t) => t.productKey === p.key);
                  const typed = Number(items[p.key] ?? 0);
                  const remainAfter = tg ? Math.max(0, tg.quantity - tg.sold - typed) : 0;
                  return (
                  <div key={p.key} className="rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-200">
                    <div className="mb-1.5 flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-700">{p.label}</span>
                      {tg && tg.quantity > 0 ? (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-black ${
                            tg.percent >= 100
                              ? "bg-emerald-100 text-emerald-700"
                              : tg.percent >= 60
                                ? "bg-sky-100 text-sky-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {toPersianDigits(tg.percent)}٪
                        </span>
                      ) : null}
                    </div>
                    {tg && tg.quantity > 0 ? (
                      <div className="mb-1.5 rounded-lg bg-white px-1.5 py-1 text-[9px] leading-4 text-slate-600 ring-1 ring-slate-200">
                        <div className="flex justify-between">
                          <span>تارگت:</span>
                          <b className="text-slate-800">{toPersianDigits(tg.quantity)}</b>
                        </div>
                        <div className="flex justify-between">
                          <span>فروخته:</span>
                          <b className="text-teal-700">{toPersianDigits(tg.sold)}</b>
                        </div>
                        <div className="flex justify-between">
                          <span>باقیمانده:</span>
                          <b className={remainAfter === 0 ? "text-emerald-700" : "text-rose-700"}>
                            {toPersianDigits(remainAfter)}
                          </b>
                        </div>
                        <div className="mt-1 h-1 overflow-hidden rounded bg-slate-200">
                          <div
                            className={`h-full ${tg.percent >= 100 ? "bg-emerald-500" : "bg-teal-500"}`}
                            style={{ width: `${Math.min(100, tg.percent)}%` }}
                          />
                        </div>
                      </div>
                    ) : null}
                    <div className="grid grid-cols-2 gap-1.5">
                      <label>
                        <span className="mb-1 block text-[10px] text-slate-500">تعداد</span>
                        <Input
                          inputMode="numeric"
                          value={items[p.key] ?? ""}
                          onChange={(e) =>
                            setItems({ ...items, [p.key]: Number(e.target.value.replace(/\D/g, "")) || 0 })
                          }
                          className="px-2 py-1.5 text-center"
                        />
                      </label>
                      <label>
                        <span className="mb-1 block text-[10px] text-slate-500">جایزه</span>
                        <Input
                          inputMode="numeric"
                          value={items[bonusKeyOf(p.key)] ?? ""}
                          onChange={(e) =>
                            setItems({ ...items, [bonusKeyOf(p.key)]: Number(e.target.value.replace(/\D/g, "")) || 0 })
                          }
                          className="px-2 py-1.5 text-center"
                        />
                      </label>
                    </div>
                  </div>
                  );
                })}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="نام پخش" hint="کشویی + جستجو + افزودن لحظه‌ای">
                  <Combobox
                    value={form.distributor}
                    onChange={(v) => set("distributor", v)}
                    options={opts.distributor ?? []}
                    category="distributor"
                    onAdded={onAdded}
                  />
                </Field>
                <Field label="نام ویزیتور" hint="کشویی + جستجو + افزودن لحظه‌ای">
                  <Combobox
                    value={form.visitor}
                    onChange={(v) => set("visitor", v)}
                    options={opts.visitor ?? []}
                    category="visitor"
                    onAdded={onAdded}
                  />
                </Field>
                <Field label="توضیحات">
                  <TextArea value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                </Field>
              </div>
            </div>
          ) : null}

          {type !== "orders" ? (
            <div className="mt-4 rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-200">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-bold text-amber-900">
                  آیا {type === "doctors" ? "این پزشک" : "این داروخانه"} درصدی می‌باشد؟
                </span>
                <div className="flex rounded-xl bg-white p-1 text-xs font-bold ring-1 ring-amber-200">
                  <button
                    type="button"
                    onClick={() => setIsPercent(true)}
                    className={`rounded-lg px-4 py-1.5 ${isPercent ? "bg-emerald-600 text-white" : "text-slate-600"}`}
                  >
                    بله
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPercent(false);
                      setPercentValue("");
                    }}
                    className={`rounded-lg px-4 py-1.5 ${!isPercent ? "bg-slate-700 text-white" : "text-slate-600"}`}
                  >
                    خیر
                  </button>
                </div>
                {isPercent ? (
                  <label className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-900">درصد / توضیح:</span>
                    <Input
                      value={percentValue}
                      onChange={(e) => setPercentValue(e.target.value)}
                      placeholder="مثلاً ۱۰٪"
                      className="max-w-[160px] px-2 py-1.5"
                    />
                  </label>
                ) : null}
              </div>
            </div>
          ) : null}

          {type !== "orders" ? (
            <div className="mt-4">
              <SectionTitle icon="📎">
                بارگذاری عکس یا فایل {type === "doctors" ? "پزشک" : "داروخانه"}
              </SectionTitle>
              <FileUploader ownerType={type === "doctors" ? "doctor" : "pharmacy"} onChangeIds={setFileIds} />
            </div>
          ) : null}

          <div className="mt-4">
            <SectionTitle icon="📍">
              {type === "doctors" ? "لوکیشن مطب" : "لوکیشن داروخانه"}
              {recordName ? ` — ${recordName}` : ""}
            </SectionTitle>
            <LocationPicker value={loc} onChange={setLoc} label={recordName || "لوکیشن"} />
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={submit} disabled={busy} className="w-full sm:w-auto">
              {busy ? "در حال ثبت..." : "💾 ثبت اطلاعات"}
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Input
              placeholder="🔍 جستجو..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-[200px]"
            />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            >
              <option value="">همه ماه‌ها</option>
              {periods.map((p) => (
                <option key={p} value={p}>
                  {toPersianDigits(p)}
                </option>
              ))}
            </select>
            <div className="flex-1" />
            <Button
              variant="success"
              onClick={async () =>
                setMsg({ kind: "success", text: await downloadFile(`/api/export?type=${type}`, `${type}.xls`) })
              }
            >
              ⬇️ خروجی اکسل
            </Button>
            {!isAdmin ? (
              <Button variant="success" onClick={sendSelected} disabled={busy}>
                📤 ارسال {selected.length ? `(${toPersianDigits(selected.length)})` : "ارسال‌نشده‌ها"}
              </Button>
            ) : null}
          </div>

          <div className="scroll-x">
            <table className="w-full min-w-[720px] text-right text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-600">
                  {visibleCols.map((c) => (
                    <th key={c.key} className="px-2 py-2 whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleCols.length} className="py-8 text-center text-slate-400">
                      رکوردی یافت نشد
                    </td>
                  </tr>
                ) : (
                  pageRows.map((r, i) => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-teal-50/40">
                      {visibleCols.map((c) => (
                        <td key={c.key} className="px-2 py-2 align-top">
                          {renderCell(c.key, r, i)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > pageRows.length ? (
            <div className="mt-3 text-center">
              <Button variant="ghost" onClick={() => setPage((p) => p + 1)}>
                نمایش بیشتر ({toPersianDigits(filtered.length - pageRows.length)} مورد دیگر)
              </Button>
            </div>
          ) : null}
        </Card>
      )}

      {editRow ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/60 sm:items-center sm:p-4"
          onClick={() => setEditRow(null)}
        >
          <div
            className="fade-in max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-4 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-black text-sky-800">✏️ ویرایش رکورد</h3>
              <button onClick={() => setEditRow(null)} className="rounded-lg bg-slate-100 px-3 py-1 text-sm">
                بستن ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="تاریخ">
                <JalaliDateInput
                  value={editDraft.dateShamsi}
                  onChange={(v) => setEditDraft({ ...editDraft, dateShamsi: v })}
                />
              </Field>
              <Field label={meta.nameLabel}>
                <Input
                  value={type === "orders" ? editDraft.pharmacyName : editDraft.name}
                  onChange={(e) =>
                    setEditDraft({
                      ...editDraft,
                      [type === "orders" ? "pharmacyName" : "name"]: e.target.value,
                    })
                  }
                />
              </Field>

              {type === "doctors" ? (
                <>
                  <Field label="تخصص">
                    <Input value={editDraft.specialty} onChange={(e) => setEditDraft({ ...editDraft, specialty: e.target.value })} />
                  </Field>
                  <Field label="شماره همراه پزشک">
                    <Input value={editDraft.phone} onChange={(e) => setEditDraft({ ...editDraft, phone: e.target.value })} />
                  </Field>
                  <Field label="نام منشی">
                    <Input value={editDraft.secretaryName} onChange={(e) => setEditDraft({ ...editDraft, secretaryName: e.target.value })} />
                  </Field>
                  <Field label="شماره منشی">
                    <Input value={editDraft.secretaryPhone} onChange={(e) => setEditDraft({ ...editDraft, secretaryPhone: e.target.value })} />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="مسئول سفارش">
                    <Input value={editDraft.managerName} onChange={(e) => setEditDraft({ ...editDraft, managerName: e.target.value })} />
                  </Field>
                  <Field label="شماره همراه">
                    <Input value={editDraft.managerPhone} onChange={(e) => setEditDraft({ ...editDraft, managerPhone: e.target.value })} />
                  </Field>
                </>
              )}

              {type !== "orders" ? (
                <>
                  <Field label="استان">
                    <Input value={editDraft.province} onChange={(e) => setEditDraft({ ...editDraft, province: e.target.value })} />
                  </Field>
                  <Field label="شهر">
                    <Input value={editDraft.city} onChange={(e) => setEditDraft({ ...editDraft, city: e.target.value })} />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="نام پخش">
                    <Input value={editDraft.distributor} onChange={(e) => setEditDraft({ ...editDraft, distributor: e.target.value })} />
                  </Field>
                  <Field label="نام ویزیتور">
                    <Input value={editDraft.visitor} onChange={(e) => setEditDraft({ ...editDraft, visitor: e.target.value })} />
                  </Field>
                </>
              )}

              <div className="sm:col-span-2">
                <Field label="آدرس">
                  <TextArea value={editDraft.address} onChange={(e) => setEditDraft({ ...editDraft, address: e.target.value })} />
                </Field>
              </div>
              {type === "orders" ? (
                <div className="sm:col-span-2">
                  <Field label="توضیحات">
                    <TextArea value={editDraft.notes} onChange={(e) => setEditDraft({ ...editDraft, notes: e.target.value })} />
                  </Field>
                </div>
              ) : null}
            </div>

            {type === "orders" ? (
              <div className="mt-3">
                <h4 className="mb-2 text-sm font-bold text-slate-700">اقلام سفارش</h4>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {products.map((p) => (
                    <div key={p.key} className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200">
                      <div className="mb-1 text-[11px] font-bold text-slate-700">{p.label}</div>
                      <div className="grid grid-cols-2 gap-1">
                        <Input
                          inputMode="numeric"
                          value={editItems[p.key] ?? ""}
                          onChange={(e) =>
                            setEditItems({ ...editItems, [p.key]: Number(e.target.value.replace(/\D/g, "")) || 0 })
                          }
                          className="px-1 py-1 text-center text-xs"
                        />
                        <Input
                          inputMode="numeric"
                          value={editItems[bonusKeyOf(p.key)] ?? ""}
                          onChange={(e) =>
                            setEditItems({
                              ...editItems,
                              [bonusKeyOf(p.key)]: Number(e.target.value.replace(/\D/g, "")) || 0,
                            })
                          }
                          className="px-1 py-1 text-center text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-4 flex gap-2">
              <Button onClick={saveEdit} disabled={busy}>
                💾 ذخیره تغییرات
              </Button>
              <Button variant="ghost" onClick={() => setEditRow(null)}>
                انصراف
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {detail ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="fade-in max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-4 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-teal-800">
                {type === "orders" ? detail.pharmacyName : detail.name}
              </h3>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    openEdit(detail);
                    setDetail(null);
                  }}
                  className="rounded-lg bg-sky-100 px-2 py-1 text-xs font-bold text-sky-700"
                >
                  ✏️ ویرایش
                </button>
                <button
                  onClick={() => {
                    const r = detail;
                    setDetail(null);
                    removeRow(r);
                  }}
                  className="rounded-lg bg-rose-100 px-2 py-1 text-xs font-bold text-rose-700"
                >
                  🗑 حذف
                </button>
                <button onClick={() => setDetail(null)} className="rounded-lg bg-slate-100 px-3 py-1 text-sm">
                  بستن ✕
                </button>
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <D k="نام نماینده" v={detail.repName} />
              <D k="تاریخ" v={toPersianDigits(detail.dateShamsi)} />
              {type !== "orders" ? (
                <>
                  <D k="استان" v={detail.province} />
                  <D k="شهر" v={detail.city} />
                  <D k="منطقه" v={detail.region} />
                </>
              ) : null}
              {type === "doctors" ? (
                <>
                  <D k="تخصص" v={detail.specialty} />
                  <D k="شماره همراه پزشک" v={toPersianDigits(detail.phone ?? "")} />
                  <D k="نام منشی" v={detail.secretaryName} />
                  <D k="شماره همراه منشی" v={toPersianDigits(detail.secretaryPhone ?? "")} />
                  <D k="آدرس مطب" v={detail.address} full />
                  <D k="آدرس مطب‌های دیگر" v={detail.otherAddresses} full />
                </>
              ) : (
                <>
                  {type === "pharmacies" ? <D k="شماره ثابت" v={toPersianDigits(detail.landline ?? "")} /> : null}
                  <D k="مسئول سفارش" v={detail.managerName} />
                  <D k="شماره همراه" v={toPersianDigits(detail.managerPhone ?? "")} />
                  <D k="آدرس" v={detail.address} full />
                </>
              )}
              {type !== "orders" ? (
                <D
                  k="وضعیت درصدی"
                  v={detail.isPercent ? `بله${detail.percentValue ? ` — ${detail.percentValue}` : ""}` : "خیر"}
                />
              ) : null}
              {type === "orders" ? (
                <>
                  <D k="نام پخش" v={detail.distributor} />
                  <D k="نام ویزیتور" v={detail.visitor} />
                  <D k="توضیحات" v={detail.notes} full />
                  <D k="وضعیت ارسال پیام‌رسان" v={detail.sendStatus} full />
                  <div className="sm:col-span-2 scroll-x">
                    <table className="w-full min-w-[380px] text-xs">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="px-2 py-1 text-right">قلم</th>
                          <th className="px-2 py-1">تعداد</th>
                          <th className="px-2 py-1">جایزه</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => (
                          <tr key={p.key} className="border-b border-slate-100">
                            <td className="px-2 py-1 text-right">{p.label}</td>
                            <td className="px-2 py-1 text-center">{toPersianDigits(detail.items?.[p.key] ?? 0)}</td>
                            <td className="px-2 py-1 text-center">
                              {toPersianDigits(detail.items?.[bonusKeyOf(p.key)] ?? 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </dl>
            {type !== "orders" ? (
              <div className="mt-3">
                <h4 className="mb-2 text-sm font-bold text-slate-700">📎 فایل‌ها و تصاویر</h4>
                <FileList files={detailFiles} />
              </div>
            ) : null}

            {type === "orders" ? (
              <div className="mt-3">
                <ShareBox text={orderText(detail)} />
              </div>
            ) : null}

            <div className="mt-3">
              {detail.lat && detail.lng ? (
                <>
                  <MapBox
                    height={220}
                    accuracy={detail.accuracy ?? null}
                    points={[
                      {
                        lat: detail.lat,
                        lng: detail.lng,
                        label: detail.locationLabel || detail.name || detail.pharmacyName,
                      },
                    ]}
                  />
                  <div className="relative z-[60] mt-2" onClick={(e) => e.stopPropagation()}>
                    <NavButton
                      lat={detail.lat}
                      lng={detail.lng}
                      label={detail.locationLabel || nameOf(detail)}
                      compact={false}
                    />
                  </div>
                </>
              ) : (
                <Alert kind="info">لوکیشنی برای این رکورد ثبت نشده است.</Alert>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function D({ k, v, full }: { k: string; v?: string | null; full?: boolean }) {
  return (
    <div className={`rounded-xl bg-slate-50 px-3 py-2 ${full ? "sm:col-span-2" : ""}`}>
      <dt className="text-[11px] font-bold text-slate-500">{k}</dt>
      <dd className="whitespace-pre-wrap text-slate-800">{v || "—"}</dd>
    </div>
  );
}

export type { Form };
