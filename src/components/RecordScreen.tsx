"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import JalaliDateInput from "./JalaliDateInput";
import Combobox from "./Combobox";
import MapBox from "./MapBox";
import { Alert, Badge, Button, Card, Field, Input, SectionTitle, TextArea } from "./ui";
import { PRODUCTS } from "@/lib/constants";
import { isValidJalali, toPersianDigits, todayJalali } from "@/lib/jalali";

export type RecordType = "pharmacies" | "doctors" | "orders";

export type Row = {
  id: number;
  repName: string;
  dateShamsi: string;
  name?: string;
  pharmacyName?: string;
  managerName?: string;
  managerPhone?: string;
  specialty?: string;
  phone?: string;
  secretaryName?: string;
  secretaryPhone?: string;
  otherAddresses?: string;
  address?: string;
  lat?: number | null;
  lng?: number | null;
  locationLabel?: string;
  items?: Record<string, number>;
  distributor?: string;
  visitor?: string;
  notes?: string;
  sent?: boolean;
  sendStatus?: string;
};

type Form = {
  dateShamsi: string;
  name: string;
  pharmacyName: string;
  managerName: string;
  managerPhone: string;
  address: string;
  specialty: string;
  phone: string;
  secretaryName: string;
  secretaryPhone: string;
  otherAddresses: string;
  distributor: string;
  visitor: string;
  notes: string;
  lat: number | null;
  lng: number | null;
  items: Record<string, number>;
};

const emptyForm = (): Form => ({
  dateShamsi: todayJalali(),
  name: "",
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
  lat: null,
  lng: null,
  items: {},
});

const TITLES: Record<RecordType, { title: string; icon: string; nameLabel: string }> = {
  pharmacies: { title: "ثبت اطلاعات داروخانه", icon: "🏥", nameLabel: "نام داروخانه" },
  doctors: { title: "ثبت اطلاعات پزشک", icon: "🩺", nameLabel: "نام پزشک" },
  orders: { title: "ثبت سفارشات داروخانه", icon: "🧾", nameLabel: "نام داروخانه" },
};

export default function RecordScreen({ type, isAdmin = false }: { type: RecordType; isAdmin?: boolean }) {
  const meta = TITLES[type];
  const [tab, setTab] = useState<"form" | "list">(isAdmin ? "list" : "form");
  const [form, setForm] = useState<Form>(emptyForm);
  const [rows, setRows] = useState<Row[]>([]);
  const [opts, setOpts] = useState<Record<string, string[]>>({});
  const [msg, setMsg] = useState<{ kind: "error" | "success" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [detail, setDetail] = useState<Row | null>(null);
  const [search, setSearch] = useState("");

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const loadRows = useCallback(async () => {
    const res = await fetch(`/api/records/${type}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setRows(data.rows ?? []);
    }
  }, [type]);

  const loadOptions = useCallback(async () => {
    const res = await fetch("/api/options", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    const grouped: Record<string, string[]> = {};
    for (const o of data.rows as { category: string; value: string }[]) {
      (grouped[o.category] ??= []).push(o.value);
    }
    setOpts(grouped);
  }, []);

  useEffect(() => {
    loadRows();
    loadOptions();
    const t = setInterval(loadOptions, 20000); // live refresh of admin-managed lists
    return () => clearInterval(t);
  }, [loadRows, loadOptions]);

  const recordName = type === "orders" ? form.pharmacyName : form.name;

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setMsg({ kind: "error", text: "مرورگر شما از موقعیت‌یاب پشتیبانی نمی‌کند" });
      return;
    }
    setMsg({ kind: "info", text: "در حال دریافت موقعیت..." });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("lat", pos.coords.latitude);
        set("lng", pos.coords.longitude);
        setMsg({ kind: "success", text: "موقعیت فعلی ثبت شد" });
      },
      () => setMsg({ kind: "error", text: "دسترسی به موقعیت مکانی امکان‌پذیر نیست" }),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const submit = async () => {
    if (!isValidJalali(form.dateShamsi)) {
      setMsg({ kind: "error", text: "تاریخ شمسی معتبر نیست (نمونه: ۱۴۰۵/۰۱/۰۱)" });
      return;
    }
    if (!recordName.trim()) {
      setMsg({ kind: "error", text: `${meta.nameLabel} الزامی است` });
      return;
    }
    setBusy(true);
    setMsg(null);
    const payload = { ...form, locationLabel: recordName.trim() };
    const res = await fetch(`/api/records/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (res.ok) {
      setForm(emptyForm());
      setMsg({ kind: "success", text: "✅ اطلاعات با موفقیت ثبت شد. برای ارسال به مدیر از تب «لیست ثبت‌شده‌ها» استفاده کنید." });
      loadRows();
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
    setBusy(true);
    const res = await fetch(`/api/records/${type}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setBusy(false);
    if (res.ok) {
      setSelected([]);
      setMsg({ kind: "success", text: `📤 ${toPersianDigits(ids.length)} رکورد برای مدیر ارسال شد` });
      loadRows();
    } else {
      setMsg({ kind: "error", text: "خطا در ارسال اطلاعات" });
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }, [rows, search]);

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
            لیست ثبت‌شده‌ها ({toPersianDigits(rows.length)})
          </button>
        </div>
      </div>

      {msg ? <Alert kind={msg.kind}>{msg.text}</Alert> : null}

      {tab === "form" ? (
        <Card>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={type === "orders" ? "تاریخ سفارش" : "تاریخ ثبت"} required hint="قابل تایپ و قابل انتخاب از تقویم">
              <JalaliDateInput value={form.dateShamsi} onChange={(v) => set("dateShamsi", v)} />
            </Field>

            {type === "doctors" ? (
              <>
                <Field label="نام پزشک" required>
                  <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="دکتر ..." />
                </Field>
                <Field label="تخصص" hint="لیست کشویی + جستجوی پیشرفته + قابل تایپ">
                  <Combobox
                    value={form.specialty}
                    onChange={(v) => set("specialty", v)}
                    options={opts.specialty ?? []}
                  />
                </Field>
                <Field label="شماره همراه پزشک">
                  <Input
                    inputMode="numeric"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="09xxxxxxxxx"
                  />
                </Field>
                <Field label="نام منشی">
                  <Input value={form.secretaryName} onChange={(e) => set("secretaryName", e.target.value)} />
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
                <Field label="نام داروخانه" required>
                  <Input
                    value={type === "orders" ? form.pharmacyName : form.name}
                    onChange={(e) => set(type === "orders" ? "pharmacyName" : "name", e.target.value)}
                  />
                </Field>
                <Field label="نام مسئول سفارش">
                  <Input value={form.managerName} onChange={(e) => set("managerName", e.target.value)} />
                </Field>
                <Field label="شماره همراه مسئول سفارش">
                  <Input
                    inputMode="numeric"
                    value={form.managerPhone}
                    onChange={(e) => set("managerPhone", e.target.value)}
                    placeholder="09xxxxxxxxx"
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

          {type === "orders" ? (
            <div className="mt-4">
              <SectionTitle icon="💊">اقلام سفارش</SectionTitle>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {PRODUCTS.map((p) => (
                  <div key={p.key} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                    <div className="mb-2 text-xs font-bold text-slate-700">{p.label}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="mb-1 block text-[10px] text-slate-500">تعداد</span>
                        <Input
                          inputMode="numeric"
                          value={form.items[p.key] ?? ""}
                          onChange={(e) =>
                            set("items", { ...form.items, [p.key]: Number(e.target.value.replace(/\D/g, "")) || 0 })
                          }
                          className="px-2 py-1.5 text-center"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[10px] text-slate-500">جایزه</span>
                        <Input
                          inputMode="numeric"
                          value={form.items[p.bonusKey] ?? ""}
                          onChange={(e) =>
                            set("items", {
                              ...form.items,
                              [p.bonusKey]: Number(e.target.value.replace(/\D/g, "")) || 0,
                            })
                          }
                          className="px-2 py-1.5 text-center"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="نام پخش" hint="کشویی + جستجو + قابل تایپ">
                  <Combobox
                    value={form.distributor}
                    onChange={(v) => set("distributor", v)}
                    options={opts.distributor ?? []}
                  />
                </Field>
                <Field label="نام ویزیتور" hint="کشویی + جستجو + قابل تایپ">
                  <Combobox value={form.visitor} onChange={(v) => set("visitor", v)} options={opts.visitor ?? []} />
                </Field>
                <Field label="توضیحات">
                  <TextArea value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                </Field>
              </div>
            </div>
          ) : null}

          <div className="mt-4">
            <SectionTitle icon="📍">
              {type === "doctors" ? "لوکیشن مطب" : "لوکیشن داروخانه"}
              {recordName ? ` (${recordName})` : ""}
            </SectionTitle>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Button variant="soft" onClick={useMyLocation}>
                📡 ثبت موقعیت فعلی من
              </Button>
              <span className="text-xs text-slate-500">یا روی نقشه نقطه مورد نظر را لمس کنید</span>
              {form.lat && form.lng ? (
                <Badge tone="green">
                  {toPersianDigits(form.lat.toFixed(5))} , {toPersianDigits(form.lng.toFixed(5))}
                </Badge>
              ) : (
                <Badge tone="amber">ثبت نشده</Badge>
              )}
            </div>
            <MapBox
              height={240}
              onPick={(p) => {
                set("lat", p.lat);
                set("lng", p.lng);
              }}
              points={
                form.lat && form.lng ? [{ lat: form.lat, lng: form.lng, label: recordName || "لوکیشن" }] : []
              }
            />
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
              placeholder="🔍 جستجو در اطلاعات ثبت‌شده..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <div className="flex-1" />
            {!isAdmin ? (
              <Button variant="success" onClick={sendSelected} disabled={busy}>
                📤 ارسال اطلاعات {selected.length ? `(${toPersianDigits(selected.length)})` : "ارسال‌نشده‌ها"}
              </Button>
            ) : (
              <a
                href={`/api/export?type=${type}`}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
              >
                ⬇️ خروجی اکسل
              </a>
            )}
          </div>
          <div className="scroll-x">
            <table className="w-full min-w-[720px] text-right text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-600">
                  <th className="rounded-r-lg px-2 py-2">ردیف</th>
                  <th className="px-2 py-2">نام نماینده</th>
                  <th className="px-2 py-2">تاریخ</th>
                  <th className="px-2 py-2">{meta.nameLabel}</th>
                  {type === "doctors" ? <th className="px-2 py-2">تخصص</th> : null}
                  {type !== "doctors" ? <th className="px-2 py-2">مسئول سفارش</th> : null}
                  <th className="px-2 py-2">شماره همراه</th>
                  {type === "orders" ? <th className="px-2 py-2">پخش / ویزیتور</th> : null}
                  <th className="px-2 py-2">لوکیشن</th>
                  <th className="rounded-l-lg px-2 py-2">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      رکوردی ثبت نشده است
                    </td>
                  </tr>
                ) : (
                  filtered.map((r, i) => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-teal-50/40">
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          {!isAdmin ? (
                            <input
                              type="checkbox"
                              className="size-4 accent-teal-600"
                              checked={selected.includes(r.id)}
                              onChange={(e) =>
                                setSelected((s) => (e.target.checked ? [...s, r.id] : s.filter((x) => x !== r.id)))
                              }
                            />
                          ) : null}
                          {toPersianDigits(i + 1)}
                        </div>
                      </td>
                      <td className="px-2 py-2 font-semibold text-slate-700">{r.repName}</td>
                      <td className="px-2 py-2">{toPersianDigits(r.dateShamsi)}</td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => setDetail(r)}
                          className="font-bold text-teal-700 underline decoration-dotted underline-offset-4"
                        >
                          {type === "orders" ? r.pharmacyName : r.name}
                        </button>
                      </td>
                      {type === "doctors" ? <td className="px-2 py-2">{r.specialty}</td> : null}
                      {type !== "doctors" ? <td className="px-2 py-2">{r.managerName}</td> : null}
                      <td className="px-2 py-2">{toPersianDigits(r.managerPhone || r.phone || "-")}</td>
                      {type === "orders" ? (
                        <td className="px-2 py-2 text-slate-600">
                          {r.distributor} {r.visitor ? `/ ${r.visitor}` : ""}
                        </td>
                      ) : null}
                      <td className="px-2 py-2">
                        {r.lat && r.lng ? <Badge tone="green">ثبت شده</Badge> : <Badge tone="amber">ندارد</Badge>}
                      </td>
                      <td className="px-2 py-2">
                        {r.sent ? <Badge tone="green">ارسال شد</Badge> : <Badge tone="amber">در انتظار ارسال</Badge>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {detail ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
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
              <button onClick={() => setDetail(null)} className="rounded-lg bg-slate-100 px-3 py-1 text-sm">
                بستن ✕
              </button>
            </div>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <Detail k="نام نماینده" v={detail.repName} />
              <Detail k="تاریخ" v={toPersianDigits(detail.dateShamsi)} />
              {type === "doctors" ? (
                <>
                  <Detail k="تخصص" v={detail.specialty} />
                  <Detail k="شماره همراه پزشک" v={toPersianDigits(detail.phone ?? "")} />
                  <Detail k="نام منشی" v={detail.secretaryName} />
                  <Detail k="شماره همراه منشی" v={toPersianDigits(detail.secretaryPhone ?? "")} />
                  <Detail k="آدرس مطب" v={detail.address} full />
                  <Detail k="آدرس مطب‌های دیگر" v={detail.otherAddresses} full />
                </>
              ) : (
                <>
                  <Detail k="مسئول سفارش" v={detail.managerName} />
                  <Detail k="شماره همراه" v={toPersianDigits(detail.managerPhone ?? "")} />
                  <Detail k="آدرس" v={detail.address} full />
                </>
              )}
              {type === "orders" ? (
                <>
                  <Detail k="نام پخش" v={detail.distributor} />
                  <Detail k="نام ویزیتور" v={detail.visitor} />
                  <Detail k="توضیحات" v={detail.notes} full />
                  <div className="sm:col-span-2">
                    <div className="scroll-x mt-2">
                      <table className="w-full min-w-[420px] text-xs">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="px-2 py-1 text-right">قلم</th>
                            <th className="px-2 py-1">تعداد</th>
                            <th className="px-2 py-1">جایزه</th>
                          </tr>
                        </thead>
                        <tbody>
                          {PRODUCTS.map((p) => (
                            <tr key={p.key} className="border-b border-slate-100">
                              <td className="px-2 py-1 text-right">{p.label}</td>
                              <td className="px-2 py-1 text-center">
                                {toPersianDigits(detail.items?.[p.key] ?? 0)}
                              </td>
                              <td className="px-2 py-1 text-center">
                                {toPersianDigits(detail.items?.[p.bonusKey] ?? 0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}
            </dl>
            <div className="mt-3">
              {detail.lat && detail.lng ? (
                <>
                  <MapBox
                    height={220}
                    points={[
                      {
                        lat: detail.lat,
                        lng: detail.lng,
                        label: detail.locationLabel || detail.name || detail.pharmacyName,
                      },
                    ]}
                  />
                  <a
                    className="mt-2 inline-block text-xs font-bold text-teal-700 underline"
                    href={`https://www.google.com/maps?q=${detail.lat},${detail.lng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    باز کردن در گوگل مپ
                  </a>
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

function Detail({ k, v, full }: { k: string; v?: string | null; full?: boolean }) {
  return (
    <div className={`rounded-xl bg-slate-50 px-3 py-2 ${full ? "sm:col-span-2" : ""}`}>
      <dt className="text-[11px] font-bold text-slate-500">{k}</dt>
      <dd className="whitespace-pre-wrap text-slate-800">{v || "—"}</dd>
    </div>
  );
}
