"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Field, Input, SectionTitle } from "@/components/ui";
import {
  ALL_PERMISSION_KEYS,
  PERMISSION_GROUPS,
  REP_DEFAULT_PERMISSIONS,
  SUPERVISOR_DEFAULT_PERMISSIONS,
} from "@/lib/defaults";
import { tehranDateTime, toPersianDigits } from "@/lib/jalali";
import { useConfirm } from "@/components/Confirm";
import { useLive } from "@/lib/useLive";

type Role = { id: number; key: string; label: string; base: string; permissions: string[]; builtin: boolean };

type User = {
  id: number;
  username: string;
  fullName: string;
  phone: string;
  role: string;
  active: boolean;
  requirePhone: boolean;
  permissions: string[];
  passwordPlain: string;
  lastSeenAt: string | null;
};

const blank = {
  username: "",
  password: "",
  fullName: "",
  phone: "",
  role: "rep",
  requirePhone: true,
  permissions: [...REP_DEFAULT_PERMISSIONS] as string[],
};



export default function UsersPage() {
  const [rows, setRows] = useState<User[]>([]);
  const [form, setForm] = useState({ ...blank });
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [openUser, setOpenUser] = useState<number | null>(null);
  const [showAllPass, setShowAllPass] = useState(false);
  const [showPass, setShowPass] = useState<Record<number, boolean>>({});
  const [pwDraft, setPwDraft] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleForm, setRoleForm] = useState({ label: "", key: "", base: "rep" });
  const [showRoles, setShowRoles] = useState(false);
  const confirm = useConfirm();

  const load = useCallback(async () => {
    const res = await fetch("/api/users", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setRows(
        (d.rows ?? []).map((u: User) => ({ ...u, permissions: Array.isArray(u.permissions) ? u.permissions : [] })),
      );
    } else setMsg({ kind: "error", text: "خطا در دریافت کاربران — دوباره وارد شوید" });
  }, []);

  const loadRoles = useCallback(async () => {
    const res = await fetch("/api/roles", { cache: "no-store" });
    if (res.ok) setRoles((await res.json()).rows ?? []);
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useLive(load, 20000);

  const create = async () => {
    if (!form.fullName.trim() || !form.username.trim() || !form.password.trim()) {
      setMsg({ kind: "error", text: "نام، نام کاربری و رمز عبور الزامی است" });
      return;
    }
    if (
      !(await confirm({
        title: "ایجاد کاربر جدید",
        message: `کاربر «${form.fullName}» با سمت «${roles.find((r) => r.key === form.role)?.label ?? form.role}» ایجاد شود؟`,
        confirmText: "ایجاد",
      }))
    )
      return;
    setBusy(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg({ kind: "success", text: "✅ کاربر جدید ایجاد شد" });
      setForm({ ...blank });
      load();
    } else setMsg({ kind: "error", text: d.error ?? "خطا" });
  };

  const patch = async (body: Record<string, unknown>, silent = false) => {
    // بروزرسانی خوش‌بینانه برای واکنش لحظه‌ای رابط کاربری
    if (typeof body.id === "number") {
      setRows((prev) =>
        prev.map((u) => (u.id === body.id ? ({ ...u, ...(body as Partial<User>) } as User) : u)),
      );
    }
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      if (!silent) setMsg({ kind: "success", text: "✅ ذخیره شد" });
      load();
    } else {
      setMsg({ kind: "error", text: "خطا در بروزرسانی" });
      load();
    }
  };

  const remove = async (id: number, name: string) => {
    if (
      !(await confirm({
        title: "حذف کاربر",
        message: `کاربر «${name}» برای همیشه حذف شود؟ این عمل قابل بازگشت نیست.`,
        confirmText: "حذف",
        danger: true,
      }))
    )
      return;
    const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
    if (res.ok) load();
  };

  const togglePerm = (u: User, key: string) => {
    const has = u.permissions.includes(key);
    patch({ id: u.id, permissions: has ? u.permissions.filter((p) => p !== key) : [...u.permissions, key] }, true);
  };

  const setPassword = async (u: User) => {
    const pw = (pwDraft[u.id] ?? "").trim();
    if (pw.length < 4) {
      setMsg({ kind: "error", text: "رمز باید حداقل ۴ کاراکتر باشد" });
      return;
    }
    if (
      !(await confirm({
        title: "تغییر رمز عبور",
        message: `رمز عبور «${u.fullName}» به «${pw}» تغییر کند؟`,
        confirmText: "تغییر بده",
      }))
    )
      return;
    await patch({ id: u.id, password: pw });
    setPwDraft({ ...pwDraft, [u.id]: "" });
    setShowPass((s) => ({ ...s, [u.id]: true }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle icon="👤">کاربران، رمز عبور و سطح دسترسی</SectionTitle>
        <div className="flex gap-2">
          <Button variant={showAllPass ? "danger" : "ghost"} onClick={() => setShowAllPass((v) => !v)}>
            {showAllPass ? "🙈 پنهان کردن همه رمزها" : "👁 نمایش همه رمزها"}
          </Button>
          <a href="/api/export?type=users" className="rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white">
            ⬇️ خروجی اکسل
          </a>
        </div>
      </div>
      {msg ? <Alert kind={msg.kind}>{msg.text}</Alert> : null}

      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">ایجاد کاربر جدید</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="نام و نام خانوادگی" required>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </Field>
          <Field label="نام کاربری" required>
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="text-left" />
          </Field>
          <Field label="رمز عبور" required>
            <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="text-left" />
          </Field>
          <Field label="شماره همراه ورود">
            <Input
              inputMode="numeric"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 11) })}
              placeholder="09xxxxxxxxx"
            />
          </Field>
          <Field label="نقش">
            <div className="flex gap-1">
              <select
                value={form.role}
                onChange={(e) => {
                  const role = e.target.value;
                  const r = roles.find((x) => x.key === role);
                  const perms = r?.permissions?.length
                    ? r.permissions
                    : r?.base === "admin"
                      ? ALL_PERMISSION_KEYS
                      : r?.base === "supervisor"
                        ? SUPERVISOR_DEFAULT_PERMISSIONS
                        : REP_DEFAULT_PERMISSIONS;
                  setForm({ ...form, role, permissions: [...perms] });
                }}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              >
                {roles.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowRoles((v) => !v)}
                title="مدیریت سمت‌ها"
                className="shrink-0 rounded-xl bg-teal-50 px-3 text-sm font-bold text-teal-700 ring-1 ring-teal-200"
              >
                ➕
              </button>
            </div>
          </Field>
        </div>

        <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600">سطح دسترسی کاربر جدید:</span>
            <button
              onClick={() => setForm({ ...form, permissions: [...ALL_PERMISSION_KEYS] })}
              className="rounded-lg bg-teal-600 px-2 py-1 text-[11px] font-bold text-white"
            >
              همه
            </button>
            <button
              onClick={() => setForm({ ...form, permissions: [] })}
              className="rounded-lg bg-slate-300 px-2 py-1 text-[11px] font-bold text-slate-700"
            >
              هیچ
            </button>
            <Badge tone="slate">{toPersianDigits(form.permissions.length)} مورد</Badge>
          </div>
          {PERMISSION_GROUPS.map((g) => (
            <div key={g.key}>
              <div className="mb-1 text-[11px] font-black text-slate-500">
                {g.icon} {g.label}
              </div>
              <div className="flex flex-wrap gap-1">
                {g.items.map((it) => {
                  const on = form.permissions.includes(it.key);
                  return (
                    <button
                      key={it.key}
                      onClick={() =>
                        setForm({
                          ...form,
                          permissions: on
                            ? form.permissions.filter((p) => p !== it.key)
                            : [...form.permissions, it.key],
                        })
                      }
                      className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                        on ? "bg-teal-100 text-teal-700 ring-1 ring-teal-300" : "bg-white text-slate-400 ring-1 ring-slate-200"
                      }`}
                    >
                      {on ? "✓ " : ""}
                      {it.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1 text-xs font-bold text-slate-600">
            <input
              type="checkbox"
              className="size-4 accent-teal-600"
              checked={form.requirePhone}
              onChange={(e) => setForm({ ...form, requirePhone: e.target.checked })}
            />
            ورود با شماره همراه اجباری باشد
          </label>
          <div className="flex-1" />
          <Button onClick={create} disabled={busy}>
            ➕ ایجاد کاربر
          </Button>
        </div>
      </Card>

      {showRoles ? (
        <Card>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-700">🏷 مدیریت سمت‌های سازمانی</h3>
            <Button variant="ghost" onClick={() => setShowRoles(false)}>
              بستن
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <Field label="عنوان سمت" required>
              <Input
                value={roleForm.label}
                onChange={(e) => setRoleForm({ ...roleForm, label: e.target.value })}
                placeholder="مثلاً کارشناس فروش"
              />
            </Field>
            <Field label="شناسه انگلیسی (اختیاری)">
              <Input
                value={roleForm.key}
                onChange={(e) => setRoleForm({ ...roleForm, key: e.target.value })}
                placeholder="sales"
                className="text-left"
              />
            </Field>
            <Field label="نقش پایه (کنترل دسترسی)">
              <select
                value={roleForm.base}
                onChange={(e) => setRoleForm({ ...roleForm, base: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              >
                <option value="rep">هم‌سطح نماینده (ورود از تب نماینده)</option>
                <option value="supervisor">هم‌سطح سرپرست (ورود از تب مدیر)</option>
                <option value="admin">هم‌سطح مدیر</option>
              </select>
            </Field>
            <div className="flex items-end">
              <Button
                onClick={async () => {
                  if (!roleForm.label.trim()) return;
                  if (
                    !(await confirm({
                      title: "افزودن سمت جدید",
                      message: `سمت «${roleForm.label}» ایجاد شود؟`,
                      confirmText: "ایجاد",
                    }))
                  )
                    return;
                  const res = await fetch("/api/roles", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(roleForm),
                  });
                  const d = await res.json().catch(() => ({}));
                  if (res.ok) {
                    setMsg({ kind: "success", text: "✅ سمت جدید ایجاد شد" });
                    setRoleForm({ label: "", key: "", base: "rep" });
                    loadRoles();
                  } else setMsg({ kind: "error", text: d.error ?? "خطا" });
                }}
                className="w-full"
              >
                ➕ افزودن سمت
              </Button>
            </div>
          </div>

          <ul className="mt-3 space-y-1">
            {roles.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs">
                <Input
                  value={r.label}
                  onChange={(e) => setRoles((p) => p.map((x) => (x.id === r.id ? { ...x, label: e.target.value } : x)))}
                  className="max-w-[180px] px-2 py-1 text-xs"
                />
                <span className="text-[10px] text-slate-400" dir="ltr">
                  {r.key}
                </span>
                <select
                  value={r.base}
                  onChange={(e) => setRoles((p) => p.map((x) => (x.id === r.id ? { ...x, base: e.target.value } : x)))}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-[11px]"
                >
                  <option value="rep">پایه: نماینده</option>
                  <option value="supervisor">پایه: سرپرست</option>
                  <option value="admin">پایه: مدیر</option>
                </select>
                {r.builtin ? <Badge tone="slate">پایه سیستم</Badge> : null}
                <span className="mr-auto flex gap-1">
                  <button
                    onClick={async () => {
                      if (!(await confirm({ title: "ذخیره سمت", message: `تغییرات «${r.label}» ذخیره شود؟`, confirmText: "ذخیره" })))
                        return;
                      const res = await fetch("/api/roles", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: r.id, label: r.label, base: r.base }),
                      });
                      setMsg(
                        res.ok
                          ? { kind: "success", text: "✅ ذخیره شد" }
                          : { kind: "error", text: "ذخیره ناموفق" },
                      );
                      loadRoles();
                      load();
                    }}
                    className="rounded-lg bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-700"
                  >
                    ذخیره
                  </button>
                  {!r.builtin ? (
                    <button
                      onClick={async () => {
                        if (
                          !(await confirm({
                            title: "حذف سمت",
                            message: `سمت «${r.label}» حذف شود؟`,
                            confirmText: "حذف",
                            danger: true,
                          }))
                        )
                          return;
                        const res = await fetch(`/api/roles?id=${r.id}`, { method: "DELETE" });
                        const d = await res.json().catch(() => ({}));
                        setMsg(
                          res.ok ? { kind: "success", text: "🗑 حذف شد" } : { kind: "error", text: d.error ?? "خطا" },
                        );
                        loadRoles();
                      }}
                      className="rounded-lg bg-rose-100 px-2 py-1 text-[11px] font-bold text-rose-700"
                    >
                      حذف
                    </button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {rows.length === 0 ? <Card>کاربری یافت نشد.</Card> : null}

      {rows.map((u, i) => {
        const open = openUser === u.id;
        const visible = showAllPass || showPass[u.id];
        return (
          <Card key={u.id}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">{toPersianDigits(i + 1)}</span>
              <span className="text-sm font-black text-slate-800">{u.fullName}</span>
              <Badge tone={u.role === "admin" ? "green" : u.role === "supervisor" ? "amber" : "slate"}>
                {roles.find((r) => r.key === u.role)?.label ?? u.role}
              </Badge>
              {!u.active ? <Badge tone="amber">غیرفعال</Badge> : null}
              <span className="text-[11px] text-slate-400">
                آخرین ورود: {u.lastSeenAt ? tehranDateTime(u.lastSeenAt) : "—"}
              </span>
              <div className="mr-auto flex flex-wrap gap-1">
                <button
                  onClick={() => setOpenUser(open ? null : u.id)}
                  className="rounded-lg bg-teal-50 px-2 py-1 text-[11px] font-bold text-teal-700 ring-1 ring-teal-200"
                >
                  ⚙️ سطح دسترسی ({toPersianDigits(u.permissions.length)}) {open ? "▲" : "▼"}
                </button>
                <button
                  onClick={() => patch({ id: u.id, active: !u.active })}
                  className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                    u.active ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {u.active ? "غیرفعال کن" : "فعال کن"}
                </button>
                <button
                  onClick={() => remove(u.id, u.fullName)}
                  className="rounded-lg bg-rose-100 px-2 py-1 text-[11px] font-bold text-rose-700"
                >
                  حذف
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold text-slate-500">نام کاربری</span>
                <Input
                  value={u.username}
                  onChange={(e) => setRows((p) => p.map((x) => (x.id === u.id ? { ...x, username: e.target.value } : x)))}
                  onBlur={() => patch({ id: u.id, username: u.username }, true)}
                  className="text-left"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] font-bold text-slate-500">رمز عبور</span>
                <div className="relative">
                  <input
                    type={visible ? "text" : "password"}
                    readOnly
                    value={u.passwordPlain || ""}
                    placeholder="ثبت نشده — رمز جدید بگذارید"
                    dir="ltr"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pr-3 pl-12 text-left font-mono text-sm text-slate-800"
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => ({ ...s, [u.id]: !s[u.id] }))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg bg-white px-2 py-1 text-xs ring-1 ring-slate-200"
                    title={visible ? "پنهان کردن رمز" : "نمایش رمز"}
                  >
                    {visible ? "🙈" : "👁"}
                  </button>
                </div>
                {u.passwordPlain ? (
                  <button
                    onClick={() => navigator.clipboard?.writeText(u.passwordPlain)}
                    className="mt-1 text-[10px] font-bold text-teal-700"
                  >
                    📋 کپی رمز
                  </button>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] font-bold text-slate-500">تغییر رمز عبور</span>
                <div className="flex gap-1">
                  <Input
                    type={visible ? "text" : "password"}
                    value={pwDraft[u.id] ?? ""}
                    onChange={(e) => setPwDraft({ ...pwDraft, [u.id]: e.target.value })}
                    placeholder="رمز جدید"
                    className="text-left"
                  />
                  <Button variant="soft" onClick={() => setPassword(u)}>
                    ثبت
                  </Button>
                </div>
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] font-bold text-slate-500">شماره همراه ورود</span>
                <Input
                  inputMode="numeric"
                  value={u.phone}
                  onChange={(e) =>
                    setRows((p) =>
                      p.map((x) => (x.id === u.id ? { ...x, phone: e.target.value.replace(/\D/g, "").slice(0, 11) } : x)),
                    )
                  }
                  onBlur={() => patch({ id: u.id, phone: u.phone }, true)}
                />
              </label>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">ورود با شماره همراه:</span>
              <button
                onClick={() => patch({ id: u.id, requirePhone: !u.requirePhone })}
                className={`rounded-lg px-3 py-1 text-[11px] font-bold ${
                  u.requirePhone ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                }`}
              >
                {u.requirePhone ? "✅ اجباری" : "⛔ غیرفعال (ورود بدون شماره)"}
              </button>
              <span className="text-[11px] font-bold text-slate-500">نقش:</span>
              <select
                value={u.role}
                onChange={(e) => patch({ id: u.id, role: e.target.value })}
                className="rounded-lg border border-slate-200 px-2 py-1 text-[11px]"
              >
                {roles.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {open ? (
              <div className="fade-in mt-3 space-y-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => patch({ id: u.id, permissions: ALL_PERMISSION_KEYS }, true)}>
                    ✅ دسترسی کامل
                  </Button>
                  <Button variant="soft" onClick={() => patch({ id: u.id, permissions: SUPERVISOR_DEFAULT_PERMISSIONS }, true)}>
                    پیش‌فرض سرپرست
                  </Button>
                  <Button variant="soft" onClick={() => patch({ id: u.id, permissions: REP_DEFAULT_PERMISSIONS }, true)}>
                    پیش‌فرض نماینده
                  </Button>
                  <Button variant="danger" onClick={() => patch({ id: u.id, permissions: [] }, true)}>
                    حذف همه
                  </Button>
                </div>

                {PERMISSION_GROUPS.map((g) => {
                  const groupKeys = g.items.map((it) => it.key);
                  const allOn = groupKeys.every((k) => u.permissions.includes(k));
                  return (
                    <div key={g.key} className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-black text-slate-700">
                          {g.icon} {g.label}
                        </span>
                        <button
                          onClick={() =>
                            patch(
                              {
                                id: u.id,
                                permissions: allOn
                                  ? u.permissions.filter((p) => !groupKeys.includes(p))
                                  : [...new Set([...u.permissions, ...groupKeys])],
                              },
                              true,
                            )
                          }
                          className={`rounded-lg px-2 py-1 text-[10px] font-bold ${
                            allOn ? "bg-rose-100 text-rose-700" : "bg-teal-100 text-teal-700"
                          }`}
                        >
                          {allOn ? "حذف این دسته" : "فعال‌سازی این دسته"}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
                        {g.items.map((it) => {
                          const on = u.permissions.includes(it.key);
                          return (
                            <label
                              key={it.key}
                              className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs ${
                                on ? "bg-teal-50 ring-1 ring-teal-200" : "bg-slate-50"
                              }`}
                            >
                              <span className="font-bold text-slate-700">{it.label}</span>
                              <input
                                type="checkbox"
                                className="size-4 accent-teal-600"
                                checked={on}
                                onChange={() => togglePerm(u, it.key)}
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
