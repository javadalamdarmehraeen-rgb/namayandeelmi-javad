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

export default function UsersPage() {
  const [rows, setRows] = useState<User[]>([]);
  const [form, setForm] = useState({ ...blank });
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [newPass, setNewPass] = useState("");
  const [showPass, setShowPass] = useState<Record<number, boolean>>({});
  const [permUser, setPermUser] = useState<User | null>(null);
  const [permTab, setPermTab] = useState(PERMISSION_GROUPS[0].key);

  const load = useCallback(async () => {
    const res = await fetch("/api/users", { cache: "no-store" });
    if (res.ok) setRows((await res.json()).rows ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg({ kind: "success", text: "کاربر جدید ایجاد شد" });
      setForm({ ...blank });
      load();
    } else setMsg({ kind: "error", text: d.error ?? "خطا" });
  };

  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setMsg({ kind: "success", text: "بروزرسانی انجام شد" });
      const fresh = await fetch("/api/users", { cache: "no-store" });
      if (fresh.ok) {
        const list: User[] = (await fresh.json()).rows ?? [];
        setRows(list);
        if (permUser) setPermUser(list.find((u) => u.id === permUser.id) ?? null);
      }
    } else setMsg({ kind: "error", text: "خطا در بروزرسانی" });
  };

  const remove = async (id: number) => {
    if (!confirm("حذف این کاربر؟")) return;
    const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
    if (res.ok) load();
  };

  const togglePerm = (u: User, key: string) => {
    const has = u.permissions?.includes(key);
    const permissions = has ? u.permissions.filter((p) => p !== key) : [...(u.permissions ?? []), key];
    patch({ id: u.id, permissions });
  };

  const roleLabel = (r: string) => (r === "admin" ? "مدیر" : r === "supervisor" ? "سرپرست" : "نماینده");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle icon="👤">کاربران، رمز عبور و سطح دسترسی</SectionTitle>
        <a href="/api/export?type=users" className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white">
          ⬇️ خروجی اکسل کاربران
        </a>
      </div>
      {msg ? <Alert kind={msg.kind}>{msg.text}</Alert> : null}

      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">ایجاد کاربر جدید</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="نام و نام خانوادگی" required>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </Field>
          <Field label="نام کاربری" required>
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </Field>
          <Field label="رمز عبور" required>
            <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
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
          <Button onClick={create}>➕ ایجاد کاربر</Button>
        </div>
      </Card>

      <Card>
        <div className="scroll-x">
          <table className="w-full min-w-[900px] text-right text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                <th className="px-2 py-2">ردیف</th>
                <th className="px-2 py-2">نام</th>
                <th className="px-2 py-2">نام کاربری</th>
                <th className="px-2 py-2">رمز عبور</th>
                <th className="px-2 py-2">شماره همراه</th>
                <th className="px-2 py-2">ورود با شماره</th>
                <th className="px-2 py-2">نقش</th>
                <th className="px-2 py-2">دسترسی</th>
                <th className="px-2 py-2">آخرین ورود</th>
                <th className="px-2 py-2">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u, i) => (
                <tr key={u.id} className="border-b border-slate-100">
                  <td className="px-2 py-2">{toPersianDigits(i + 1)}</td>
                  <td className="px-2 py-2 font-bold text-slate-700">{u.fullName}</td>
                  <td className="px-2 py-2">{u.username}</td>
                  <td className="px-2 py-2">
                    <button
                      onClick={() => setShowPass((s) => ({ ...s, [u.id]: !s[u.id] }))}
                      className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[11px] font-bold text-slate-700"
                      title={showPass[u.id] ? "پنهان کردن" : "نمایش رمز"}
                    >
                      {showPass[u.id] ? `${u.passwordPlain || "—"} 🙈` : "•••••• 👁"}
                    </button>
                  </td>
                  <td className="px-2 py-2">{toPersianDigits(u.phone)}</td>
                  <td className="px-2 py-2">
                    <button
                      onClick={() => patch({ id: u.id, requirePhone: !u.requirePhone })}
                      className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                        u.requirePhone ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {u.requirePhone ? "اجباری" : "غیرفعال"}
                    </button>
                  </td>
                  <td className="px-2 py-2">
                    <select
                      value={u.role}
                      onChange={(e) => patch({ id: u.id, role: e.target.value })}
                      className="rounded-lg border border-slate-200 px-1 py-1 text-[11px]"
                    >
                      <option value="rep">نماینده</option>
                      <option value="supervisor">سرپرست</option>
                      <option value="admin">مدیر</option>
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <button
                      onClick={() => {
                        setPermUser(u);
                        setPermTab(PERMISSION_GROUPS[0].key);
                      }}
                      className="rounded-lg bg-teal-50 px-2 py-1 text-[11px] font-bold text-teal-700 ring-1 ring-teal-200"
                    >
                      ⚙️ {toPersianDigits(u.permissions?.length ?? 0)} دسترسی
                    </button>
                  </td>
                  <td className="px-2 py-2 text-[11px] text-slate-500">
                    {u.lastSeenAt ? tehranDateTime(u.lastSeenAt) : "—"}
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => patch({ id: u.id, active: !u.active })}
                        className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                          u.active ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {u.active ? "غیرفعال کن" : "فعال کن"}
                      </button>
                      <button
                        onClick={() => {
                          setEditing(u);
                          setNewPass("");
                        }}
                        className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => remove(u.id)}
                        className="rounded-lg bg-rose-100 px-2 py-1 text-[11px] font-bold text-rose-700"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {permUser ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onClick={() => setPermUser(null)}>
          <div
            className="fade-in max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-4 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-slate-800">
                سطح دسترسی {permUser.fullName} <Badge tone="slate">{roleLabel(permUser.role)}</Badge>
              </h3>
              <button onClick={() => setPermUser(null)} className="rounded-lg bg-slate-100 px-3 py-1 text-sm">
                بستن ✕
              </button>
            </div>

            <div className="mb-3 flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 text-[11px] font-bold">
              {PERMISSION_GROUPS.map((g) => (
                <button
                  key={g.key}
                  onClick={() => setPermTab(g.key)}
                  className={`rounded-lg px-2.5 py-2 ${permTab === g.key ? "bg-teal-600 text-white" : "text-slate-600"}`}
                >
                  {g.icon} {g.label}
                </button>
              ))}
            </div>

            {PERMISSION_GROUPS.filter((g) => g.key === permTab).map((g) => (
              <div key={g.key} className="space-y-1">
                {g.items.map((it) => {
                  const on = permUser.permissions?.includes(it.key);
                  return (
                    <label
                      key={it.key}
                      className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm ${on ? "bg-teal-50 ring-1 ring-teal-200" : "bg-slate-50"}`}
                    >
                      <span className="font-bold text-slate-700">{it.label}</span>
                      <input
                        type="checkbox"
                        className="size-5 accent-teal-600"
                        checked={on}
                        onChange={() => togglePerm(permUser, it.key)}
                      />
                    </label>
                  );
                })}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="soft"
                    onClick={() =>
                      patch({
                        id: permUser.id,
                        permissions: [...new Set([...(permUser.permissions ?? []), ...g.items.map((i) => i.key)])],
                      })
                    }
                  >
                    فعال‌سازی همه این دسته
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      patch({
                        id: permUser.id,
                        permissions: (permUser.permissions ?? []).filter(
                          (p) => !g.items.some((i) => i.key === p),
                        ),
                      })
                    }
                  >
                    حذف همه این دسته
                  </Button>
                </div>
              </div>
            ))}

            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              <Button onClick={() => patch({ id: permUser.id, permissions: ALL_PERMISSION_KEYS })}>
                ✅ دسترسی کامل
              </Button>
              <Button
                variant="soft"
                onClick={() => patch({ id: permUser.id, permissions: SUPERVISOR_DEFAULT_PERMISSIONS })}
              >
                پیش‌فرض سرپرست
              </Button>
              <Button variant="soft" onClick={() => patch({ id: permUser.id, permissions: REP_DEFAULT_PERMISSIONS })}>
                پیش‌فرض نماینده
              </Button>
              <Button variant="danger" onClick={() => patch({ id: permUser.id, permissions: [] })}>
                حذف همه دسترسی‌ها
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {editing ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setEditing(null)}>
          <div className="fade-in w-full max-w-md rounded-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 font-bold text-slate-800">ویرایش {editing.fullName}</h3>
            <div className="space-y-3">
              <Field label="نام">
                <Input value={editing.fullName} onChange={(e) => setEditing({ ...editing, fullName: e.target.value })} />
              </Field>
              <Field label="نام کاربری">
                <Input value={editing.username} onChange={(e) => setEditing({ ...editing, username: e.target.value })} />
              </Field>
              <Field label="شماره همراه ورود">
                <Input
                  inputMode="numeric"
                  value={editing.phone}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                />
              </Field>
              <Field label="رمز عبور جدید" hint="خالی بماند یعنی بدون تغییر">
                <Input value={newPass} onChange={(e) => setNewPass(e.target.value)} />
              </Field>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={async () => {
                  await patch({
                    id: editing.id,
                    fullName: editing.fullName,
                    username: editing.username,
                    phone: editing.phone,
                    ...(newPass ? { password: newPass } : {}),
                  });
                  setEditing(null);
                }}
              >
                ذخیره
              </Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>
                انصراف
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
