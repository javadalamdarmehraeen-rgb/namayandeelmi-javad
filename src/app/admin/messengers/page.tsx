"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Field, Input, SectionTitle } from "@/components/ui";
import { PLATFORMS } from "@/lib/constants";
import { tehranDateTime } from "@/lib/jalali";

type M = {
  id: number;
  platform: string;
  label: string;
  targetType: string;
  target: string;
  token: string;
  enabled: boolean;
};
type Log = { id: number; platform: string; target: string; ok: boolean; detail: string; createdAt: string };

const blank = { platform: "bale", label: "", targetType: "phone", target: "", token: "", enabled: true };

export default function MessengersPage() {
  const [rows, setRows] = useState<M[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [form, setForm] = useState({ ...blank });
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/messengers", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setRows(d.rows ?? []);
      setLogs(d.logs ?? []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    const res = await fetch("/api/messengers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ ...blank });
      setMsg("مقصد جدید ثبت شد");
      load();
    }
  };

  const patch = async (body: Record<string, unknown>) => {
    await fetch("/api/messengers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    load();
  };

  const remove = async (id: number) => {
    await fetch(`/api/messengers?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-4">
      <SectionTitle icon="📨">ارسال خودکار سفارشات به پیام‌رسان‌ها</SectionTitle>
      <Alert kind="info">
        پس از ارسال سفارش توسط نماینده، متن سفارش به ترتیب فیلدها برای همه مقصدهای «فعال» ارسال می‌شود. توکن بله:
        توکن ربات، ایتا: توکن eitaayar، واتساپ: به صورت <b>phoneNumberId:accessToken</b>.
      </Alert>
      {msg ? <Alert kind="success">{msg}</Alert> : null}

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="پیام‌رسان">
            <select
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            >
              {PLATFORMS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="نوع مقصد">
            <select
              value={form.targetType}
              onChange={(e) => setForm({ ...form, targetType: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            >
              <option value="phone">شماره همراه / چت شخصی</option>
              <option value="group">گروه / کانال</option>
            </select>
          </Field>
          <Field label="شناسه مقصد" hint="شماره همراه یا chat_id گروه">
            <Input value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
          </Field>
          <Field label="توکن">
            <Input value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} />
          </Field>
          <Field label="عنوان">
            <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </Field>
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={add}>➕ افزودن مقصد</Button>
        </div>
      </Card>

      <Card>
        <div className="scroll-x">
          <table className="w-full min-w-[760px] text-right text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                <th className="px-2 py-2">پیام‌رسان</th>
                <th className="px-2 py-2">عنوان</th>
                <th className="px-2 py-2">نوع</th>
                <th className="px-2 py-2">مقصد</th>
                <th className="px-2 py-2">وضعیت</th>
                <th className="px-2 py-2">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-b border-slate-100">
                  <td className="px-2 py-2 font-bold">{PLATFORMS.find((p) => p.key === m.platform)?.label}</td>
                  <td className="px-2 py-2">{m.label || "—"}</td>
                  <td className="px-2 py-2">{m.targetType === "group" ? "گروه" : "شماره همراه"}</td>
                  <td className="px-2 py-2">{m.target}</td>
                  <td className="px-2 py-2">
                    <Badge tone={m.enabled ? "green" : "amber"}>{m.enabled ? "فعال" : "غیرفعال"}</Badge>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => patch({ id: m.id, enabled: !m.enabled })}
                        className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold"
                      >
                        {m.enabled ? "غیرفعال" : "فعال"}
                      </button>
                      <button
                        onClick={() => remove(m.id)}
                        className="rounded-lg bg-rose-100 px-2 py-1 text-[11px] font-bold text-rose-700"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    مقصدی تعریف نشده است
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <SectionTitle icon="📜">آخرین ارسال‌ها</SectionTitle>
        <div className="max-h-64 space-y-1 overflow-y-auto text-xs">
          {logs.map((l) => (
            <div key={l.id} className="rounded-lg bg-slate-50 px-3 py-1.5">
              <span className={l.ok ? "text-emerald-700" : "text-rose-700"}>{l.ok ? "✔" : "✖"}</span>{" "}
              {PLATFORMS.find((p) => p.key === l.platform)?.label} → {l.target}
              <span className="mr-2 text-[10px] text-slate-400">{tehranDateTime(l.createdAt)}</span>
            </div>
          ))}
          {logs.length === 0 ? <p className="text-slate-400">هنوز ارسالی انجام نشده است</p> : null}
        </div>
      </Card>
    </div>
  );
}
