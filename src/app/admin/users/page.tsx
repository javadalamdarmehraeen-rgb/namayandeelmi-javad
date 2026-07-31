"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Field, Input, SectionTitle } from "@/components/ui";
import { PERMISSIONS } from "@/lib/constants";
import { tehranDateTime, toPersianDigits } from "@/lib/jalali";

type User = {
  id: number;
  username: string;
  fullName: string;
  phone: string;
  role: string;
  active: boolean;
  permissions: string[];
  lastSeenAt: string | null;
};

const blank = {
  username: "",
  password: "",
  fullName: "",
  phone: "",
  role: "rep",
  permissions: ["pharmacy", "doctor", "order", "trip"] as string[],
};

export default function UsersPage() {
  const [rows, setRows] = useState<User[]>([]);
  const [form, setForm] = useState({ ...blank });
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [newPass, setNewPass] = useState("");

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
      load();
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

  return (
    <div className="space-y-4">
      <SectionTitle icon="👤">تعریف نماینده، رمز عبور و سطح دسترسی</SectionTitle>
      {msg ? <Alert kind={msg.kind}>{msg.text}</Alert> : null}

      <Card>
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
          <Field label="شماره همراه ورود" required>
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
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            >
              <option value="rep">نماینده علمی</option>
              <option value="admin">مدیر</option>
            </select>
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {PERMISSIONS.map((p) => (
            <label key={p.key} className="flex items-center gap-1 text-xs font-bold text-slate-600">
              <input
                type="checkbox"
                className="size-4 accent-teal-600"
                checked={form.permissions.includes(p.key)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    permissions: e.target.checked
                      ? [...form.permissions, p.key]
                      : form.permissions.filter((x) => x !== p.key),
                  })
                }
              />
              {p.label}
            </label>
          ))}
          <div className="flex-1" />
          <Button onClick={create}>➕ ایجاد کاربر</Button>
        </div>
      </Card>

      <Card>
        <div className="scroll-x">
          <table className="w-full min-w-[860px] text-right text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                <th className="px-2 py-2">ردیف</th>
                <th className="px-2 py-2">نام</th>
                <th className="px-2 py-2">نام کاربری</th>
                <th className="px-2 py-2">شماره همراه</th>
                <th className="px-2 py-2">نقش</th>
                <th className="px-2 py-2">سطح دسترسی</th>
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
                  <td className="px-2 py-2">{toPersianDigits(u.phone)}</td>
                  <td className="px-2 py-2">
                    <Badge tone={u.role === "admin" ? "green" : "slate"}>
                      {u.role === "admin" ? "مدیر" : "نماینده"}
                    </Badge>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-1">
                      {PERMISSIONS.map((p) => (
                        <button
                          key={p.key}
                          onClick={() => togglePerm(u, p.key)}
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                            u.permissions?.includes(p.key)
                              ? "bg-teal-100 text-teal-700"
                              : "bg-slate-100 text-slate-400 line-through"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
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
              <Field label="رمز عبور جدید" hint="در صورت خالی بودن تغییری نمی‌کند">
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
