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

const roleLabel = (r: string) => (r === "admin" ? "مدیر" : r === "supervisor" ? "سرپرست" : "نماینده علمی");

export default function UsersPage() {
  const [rows, setRows] = useState<User[]>([]);
  const [form, setForm] = useState({ ...blank });
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [openUser, setOpenUser] = useState<number | null>(null);
  const [showAllPass, setShowAllPass] = useState(false);
  const [showPass, setShowPass] = useState<Record<number, boolean>>({});
  const [pwDraft, setPwDraft] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/users", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setRows(
        (d.rows ?? []).map((u: User) => ({ ...u, permissions: Array.isArray(u.permissions) ? u.permissions : [] })),
      );
    } else setMsg({ kind: "error", text: "خطا در دریافت کاربران — دوباره وارد شوید" });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
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

  const remove = async (id: number) => {
    if (!confirm("حذف این کاربر؟")) return;
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
            <select
              value={form.role}
              onChange={(e) => {
                const role = e.target.value;
                setForm({
                  ...form,
                  role,
                  permissions:
                    role === "admin"
                      ? [...ALL_PERMISSION_KEYS]
                      : role === "supervisor"
                        ? [...SUPERVISOR_DEFAULT_PERMISSIONS]
                        : [...REP_DEFAULT_PERMISSIONS],
                });
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            >
              <option value="rep">نماینده علمی</option>
              <option value="supervisor">سرپرست</option>
              <option value="admin">مدیر</option>
            </select>
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
                {roleLabel(u.role)}
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
                  onClick={() => remove(u.id)}
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
                <span className="mb-1 block text-[11px] font-bold text-slate-500">رمز عبور فعلی</span>
                <div className="flex gap-1">
                  <div className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-left font-mono text-sm">
                    {visible ? u.passwordPlain || "ثبت نشده" : "••••••••"}
                  </div>
                  <button
                    onClick={() => setShowPass((s) => ({ ...s, [u.id]: !s[u.id] }))}
                    className="rounded-xl bg-slate-100 px-3 text-sm ring-1 ring-slate-200"
                    title={visible ? "پنهان" : "نمایش"}
                  >
                    {visible ? "🙈" : "👁"}
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] font-bold text-slate-500">تغییر رمز عبور</span>
                <div className="flex gap-1">
                  <Input
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
                <option value="rep">نماینده علمی</option>
                <option value="supervisor">سرپرست</option>
                <option value="admin">مدیر</option>
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
