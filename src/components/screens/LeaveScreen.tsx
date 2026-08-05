"use client";

import { useCallback, useEffect, useState } from "react";
import JalaliDateInput from "@/components/JalaliDateInput";
import { Alert, Badge, Button, Card, Field, Input, SectionTitle, TextArea } from "@/components/ui";
import { toPersianDigits, todayJalali } from "@/lib/jalali";
import { useSession } from "@/components/SessionProvider";
import Combobox from "@/components/Combobox";
import { useConfirm } from "@/components/Confirm";
import { useLive } from "@/lib/useLive";
import { JALALI_MONTHS } from "@/lib/jalali";

type Leave = {
  id: number;
  repName: string;
  kind: string;
  fromDate: string;
  toDate: string;
  days: number;
  fromTime: string;
  toTime: string;
  hours: number;
  reason: string;
  supervisorStatus: string;
  supervisorNote: string;
  supervisorName: string;
  managerStatus: string;
  managerNote: string;
  managerName: string;
};

const KINDS = ["روزانه", "ساعتی", "استعلاجی", "استحقاقی ساعتی", "بدون حقوق", "اضطراری"];

function StatusBadge({ s }: { s: string }) {
  if (s === "approved") return <Badge tone="green">تایید شد</Badge>;
  if (s === "rejected") return <Badge tone="amber">رد شد</Badge>;
  return <Badge tone="slate">در انتظار</Badge>;
}

export default function LeaveScreen() {
  const { me } = useSession();
  const role = me?.role ?? "rep";
  const [showForm, setShowForm] = useState(true);
  const [rows, setRows] = useState<Leave[]>([]);
  const [kind, setKind] = useState("روزانه");
  const [fromDate, setFrom] = useState(todayJalali());
  const [toDate, setTo] = useState(todayJalali());
  const [days, setDays] = useState("1");
  const [fromTime, setFromTime] = useState("08:00");
  const [toTime, setToTime] = useState("12:00");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [kinds, setKinds] = useState<string[]>(KINDS);
  const [period, setPeriod] = useState("");
  const confirm = useConfirm();

  const loadKinds = useCallback(async () => {
    const res = await fetch("/api/options?category=leaveKind", { cache: "no-store" });
    if (!res.ok) return;
    const d = await res.json();
    const vals = (d.rows ?? []).map((r: { value: string }) => r.value);
    setKinds([...new Set([...KINDS, ...vals])]);
  }, []);

  const load = useCallback(async () => {
    const res = await fetch("/api/leaves", { cache: "no-store" });
    if (res.ok) setRows((await res.json()).rows ?? []);
  }, []);

  useEffect(() => {
    loadKinds();
  }, [loadKinds]);

  // بروزرسانی لحظه‌ای وضعیت تاییدها
  useLive(load, 20000);

  const submit = async () => {
    const summary = isHourly
      ? `مرخصی ساعتی ${toPersianDigits(fromDate)} از ساعت ${toPersianDigits(fromTime)} تا ${toPersianDigits(toTime)} (${toPersianDigits(hoursCalc)} ساعت)`
      : `مرخصی ${kind} از ${toPersianDigits(fromDate)} تا ${toPersianDigits(toDate)} (${toPersianDigits(days)} روز)`;
    if (!(await confirm({ title: "ثبت درخواست مرخصی", message: `${summary}\nارسال شود؟`, confirmText: "ارسال درخواست" })))
      return;
    const res = await fetch("/api/leaves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        fromDate,
        toDate,
        days: isHourly ? 0 : Number(days) || 1,
        fromTime: isHourly ? fromTime : "",
        toTime: isHourly ? toTime : "",
        hours: isHourly ? hoursCalc : 0,
        reason,
      }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg({ kind: "success", text: "✅ درخواست مرخصی ثبت و برای سرپرست و مدیر ارسال شد" });
      setReason("");
      load();
    } else setMsg({ kind: "error", text: d.error ?? "خطا در ثبت درخواست" });
  };

  const decide = async (id: number, status: "approved" | "rejected") => {
    const row = rows.find((r) => r.id === id);
    if (
      !(await confirm({
        title: status === "approved" ? "تایید مرخصی" : "رد مرخصی",
        message: `درخواست «${row?.repName ?? ""}» ${status === "approved" ? "تایید" : "رد"} شود؟`,
        confirmText: status === "approved" ? "تایید" : "رد کن",
        danger: status === "rejected",
      }))
    )
      return;
    const note = window.prompt(status === "approved" ? "توضیح تایید (اختیاری)" : "علت رد درخواست") ?? "";
    const res = await fetch("/api/leaves", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, note }),
    });
    if (res.ok) load();
    else setMsg({ kind: "error", text: "ثبت تایید ناموفق بود" });
  };

  const canDecide = role === "admin" || role === "supervisor";

  const periods = [...new Set(rows.map((r) => r.fromDate.slice(0, 7)))].sort().reverse();
  const monthName = (p: string) =>
    `${JALALI_MONTHS[Number(p.slice(5, 7)) - 1] ?? ""} ${toPersianDigits(p.slice(0, 4))}`;

  const scoped = rows.filter((r) => !period || r.fromDate.startsWith(period));

  const summary = (() => {
    const m = new Map<string, { period: string; rep: string; count: number; days: number; hours: number }>();
    for (const r of scoped) {
      const per = r.fromDate.slice(0, 7);
      const k = `${per}|${r.repName}`;
      const cur = m.get(k) ?? { period: per, rep: r.repName, count: 0, days: 0, hours: 0 };
      cur.count++;
      cur.days += Number(r.days || 0);
      cur.hours += Number(r.hours || 0);
      m.set(k, cur);
    }
    return [...m.values()].sort((a, b) =>
      a.period === b.period ? a.rep.localeCompare(b.rep) : b.period.localeCompare(a.period),
    );
  })();

  const totals = scoped.reduce(
    (a, r) => {
      const ok = r.managerStatus === "approved";
      return {
        days: a.days + (ok ? Number(r.days || 0) : 0),
        hours: a.hours + (ok ? Number(r.hours || 0) : 0),
        pending: a.pending + (r.managerStatus === "pending" ? 1 : 0),
      };
    },
    { days: 0, hours: 0, pending: 0 },
  );
  const isHourly = kind.includes("ساعتی");
  const hoursCalc = (() => {
    const [h1, m1] = fromTime.split(":").map(Number);
    const [h2, m2] = toTime.split(":").map(Number);
    const diff = (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
    return diff > 0 ? Math.round(diff * 100) / 100 : 0;
  })();

  return (
    <div className="space-y-4">
      <SectionTitle icon="📝">درخواست مرخصی (دو مرحله تایید: سرپرست + مدیر)</SectionTitle>
      {msg ? <Alert kind={msg.kind}>{msg.text}</Alert> : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant={showForm ? "primary" : "ghost"} onClick={() => setShowForm(true)}>
          ➕ ثبت درخواست مرخصی
        </Button>
        <Button variant={!showForm ? "primary" : "ghost"} onClick={() => setShowForm(false)}>
          📋 لیست درخواست‌ها
        </Button>
      </div>

      {showForm ? (
        <Card>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="نوع مرخصی" hint="کشویی + افزودن لحظه‌ای">
              <Combobox value={kind} onChange={setKind} options={kinds} category="leaveKind" onAdded={loadKinds} />
            </Field>
            <Field label="از تاریخ" required>
              <JalaliDateInput value={fromDate} onChange={setFrom} />
            </Field>
            <Field label="تا تاریخ" required>
              <JalaliDateInput value={toDate} onChange={setTo} />
            </Field>
            {isHourly ? (
              <>
                <Field label="ساعت شروع" required>
                  <input
                    type="time"
                    value={fromTime}
                    onChange={(e) => setFromTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                  />
                </Field>
                <Field label="ساعت پایان" required>
                  <input
                    type="time"
                    value={toTime}
                    onChange={(e) => setToTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                  />
                </Field>
                <Field label="مدت (ساعت)">
                  <div className="rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-bold text-teal-700">
                    {toPersianDigits(hoursCalc)} ساعت
                  </div>
                </Field>
              </>
            ) : (
              <Field label="تعداد روز">
                <Input inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ""))} />
              </Field>
            )}
            <div className="sm:col-span-2 lg:col-span-4">
              <Field label="علت مرخصی">
                <TextArea value={reason} onChange={(e) => setReason(e.target.value)} />
              </Field>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button onClick={submit}>📨 ارسال درخواست</Button>
          </div>
        </Card>
      ) : null}

      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">📊 جمع مرخصی‌ها به تفکیک ماه و سال</h3>
        <div className="mb-3 flex flex-wrap gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
          >
            <option value="">همه دوره‌ها</option>
            {periods.map((p) => (
              <option key={p} value={p}>
                {monthName(p)}
              </option>
            ))}
          </select>
          {["approvedDays", "approvedHours", "pending"].map((k) => {
            const map: Record<string, [string, string | number, string]> = {
              approvedDays: ["روز تاییدشده", toPersianDigits(totals.days), "bg-emerald-50 text-emerald-800"],
              approvedHours: ["ساعت تاییدشده", toPersianDigits(totals.hours), "bg-sky-50 text-sky-800"],
              pending: ["در انتظار تایید", toPersianDigits(totals.pending), "bg-amber-50 text-amber-800"],
            };
            const [l, v, c] = map[k];
            return (
              <div key={k} className={`rounded-xl px-4 py-2 text-center ring-1 ring-slate-200 ${c}`}>
                <div className="text-lg font-black">{v}</div>
                <div className="text-[10px] font-bold">{l}</div>
              </div>
            );
          })}
        </div>
        <div className="scroll-x">
          <table className="w-full min-w-[520px] text-right text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                <th className="px-2 py-2">ماه و سال</th>
                <th className="px-2 py-2">نام</th>
                <th className="px-2 py-2">تعداد درخواست</th>
                <th className="px-2 py-2">جمع روز</th>
                <th className="px-2 py-2">جمع ساعت</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((s) => (
                <tr key={`${s.period}-${s.rep}`} className="border-b border-slate-100">
                  <td className="px-2 py-2 font-bold text-teal-700">{monthName(s.period)}</td>
                  <td className="px-2 py-2">{s.rep}</td>
                  <td className="px-2 py-2">{toPersianDigits(s.count)}</td>
                  <td className="px-2 py-2">{toPersianDigits(s.days)}</td>
                  <td className="px-2 py-2">{toPersianDigits(Math.round(s.hours * 100) / 100)}</td>
                </tr>
              ))}
              {summary.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-400">
                    داده‌ای برای این دوره نیست
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700">لیست درخواست‌ها</h3>
          <a href="/api/export?type=leaves" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">
            ⬇️ خروجی اکسل
          </a>
        </div>
        <div className="scroll-x">
          <table className="w-full min-w-[820px] text-right text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                <th className="px-2 py-2">ردیف</th>
                <th className="px-2 py-2">نام نماینده</th>
                <th className="px-2 py-2">نوع</th>
                <th className="px-2 py-2">از</th>
                <th className="px-2 py-2">تا</th>
                <th className="px-2 py-2">روز / ساعت</th>
                <th className="px-2 py-2">علت</th>
                <th className="px-2 py-2">تایید سرپرست</th>
                <th className="px-2 py-2">تایید مدیر</th>
                {canDecide ? <th className="px-2 py-2">اقدام</th> : null}
              </tr>
            </thead>
            <tbody>
              {scoped.map((r, i) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-2 py-2">{toPersianDigits(i + 1)}</td>
                  <td className="px-2 py-2 font-bold text-slate-700">{r.repName}</td>
                  <td className="px-2 py-2">{r.kind}</td>
                  <td className="px-2 py-2">{toPersianDigits(r.fromDate)}</td>
                  <td className="px-2 py-2">{toPersianDigits(r.toDate)}</td>
                  <td className="px-2 py-2">
                    {r.hours > 0 ? (
                      <span className="font-bold text-sky-700">
                        {toPersianDigits(r.hours)} ساعت
                        <div className="text-[10px] text-slate-400">
                          {toPersianDigits(r.fromTime)} تا {toPersianDigits(r.toTime)}
                        </div>
                      </span>
                    ) : (
                      `${toPersianDigits(r.days)} روز`
                    )}
                  </td>
                  <td className="max-w-[180px] truncate px-2 py-2 text-slate-500">{r.reason}</td>
                  <td className="px-2 py-2">
                    <StatusBadge s={r.supervisorStatus} />
                    {r.supervisorName ? (
                      <div className="text-[10px] text-slate-400">{r.supervisorName}</div>
                    ) : null}
                  </td>
                  <td className="px-2 py-2">
                    <StatusBadge s={r.managerStatus} />
                    {r.managerName ? <div className="text-[10px] text-slate-400">{r.managerName}</div> : null}
                  </td>
                  {canDecide ? (
                    <td className="px-2 py-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => decide(r.id, "approved")}
                          className="rounded-lg bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-700"
                        >
                          تایید
                        </button>
                        <button
                          onClick={() => decide(r.id, "rejected")}
                          className="rounded-lg bg-rose-100 px-2 py-1 text-[11px] font-bold text-rose-700"
                        >
                          رد
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
              {scoped.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-slate-400">
                    درخواستی ثبت نشده است
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
