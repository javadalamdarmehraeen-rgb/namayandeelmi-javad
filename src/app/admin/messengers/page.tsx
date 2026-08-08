"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Field, Input, SectionTitle } from "@/components/ui";
import { PLATFORMS } from "@/lib/constants";
import { tehranDateTime, toPersianDigits } from "@/lib/jalali";
import { useConfirm } from "@/components/Confirm";
import { useLive } from "@/lib/useLive";

type M = {
  id: number;
  platform: string;
  label: string;
  targetType: string;
  target: string;
  token: string;
  provider: string;
  apiUrl: string;
  enabled: boolean;
  lastStatus: string;
  lastOkAt: string | null;
  lastErrorAt: string | null;
};
type Log = { id: number; platform: string; target: string; ok: boolean; detail: string; createdAt: string };
type Proxy = { url: string; enabled: boolean; secret?: string };
type Chat = { id: string; title: string; type: string };
type Sms = { provider: string; apiKey: string; sender: string; pattern: string; enabled: boolean };

const WA_PROVIDERS = [
  { key: "whatsiplus", label: "واتس‌آی‌پلاس (whatsiplus.ir)", hint: "کلید API از پنل | مقصد: ۰۹۱۲…" },
  { key: "ultramsg", label: "UltraMsg", hint: "توکن: instanceId:token | مقصد: 989121111111" },
  { key: "cloudapi", label: "WhatsApp Cloud API (متا)", hint: "توکن: phoneNumberId:accessToken" },
  { key: "custom", label: "سرویس سفارشی", hint: "آدرس با {phone} و {text} و {token}" },
];

const emptyForm = (platform: string) => ({
  platform,
  label: "",
  targetType: platform === "whatsapp" ? "phone" : "group",
  target: "",
  token: "",
  provider: platform === "whatsapp" ? "whatsiplus" : "",
  apiUrl: "",
  enabled: true,
});

export default function MessengersPage() {
  const [rows, setRows] = useState<M[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [proxy, setProxy] = useState<Proxy>({ url: "", enabled: true, secret: "" });
  const [sms, setSms] = useState<Sms>({ provider: "kavenegar", apiKey: "", sender: "", pattern: "", enabled: false });
  const [sysTokens, setSysTokens] = useState<Record<string, string>>({});
  const [tab, setTab] = useState("telegram");
  const [form, setForm] = useState(emptyForm("telegram"));
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatBusy, setChatBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [showToken, setShowToken] = useState<Record<number, boolean>>({});
  const [testing, setTesting] = useState<number | null>(null);
  const [workerVersion, setWorkerVersion] = useState<"new" | "old" | "down" | "">("");
  const [autoSend, setAutoSend] = useState(true);
  const confirm = useConfirm();

  const meta = PLATFORMS.find((p) => p.key === tab)!;

  const load = useCallback(async () => {
    const res = await fetch("/api/messengers", { cache: "no-store" });
    if (!res.ok) return;
    const d = await res.json();
    setRows(d.rows ?? []);
    setLogs(d.logs ?? []);
    if (d.proxy) setProxy(d.proxy);
    if (d.sms) setSms(d.sms);
    if (typeof d.autoSend === "boolean") setAutoSend(d.autoSend);
  }, []);

  useLive(load, 30000);

  useEffect(() => {
    fetch("/api/messengers/updates", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setSysTokens(d?.tokens ?? {}))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setForm(emptyForm(tab));
    setChats([]);
  }, [tab]);

  /* ----------------------------- عملیات ----------------------------- */

  const add = async () => {
    if (!form.target.trim()) return setMsg("✖ شناسه مقصد الزامی است");
    if (meta.needsToken && !form.token.trim() && !sysTokens[tab]) {
      return setMsg("✖ توکن این پیام‌رسان وارد نشده است");
    }
    if (
      !(await confirm({
        title: `افزودن مقصد ${meta.label}`,
        message: `مقصد «${form.label || form.target}» اضافه شود؟`,
        confirmText: "افزودن",
      }))
    )
      return;
    const res = await fetch("/api/messengers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setForm(emptyForm(tab));
      setMsg("✅ مقصد جدید ثبت شد");
      load();
    } else setMsg(`✖ ${d.error ?? "خطا در ثبت"}`);
  };

  const patch = async (body: Record<string, unknown>) => {
    await fetch("/api/messengers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    load();
  };

  const remove = async (m: M) => {
    if (
      !(await confirm({
        title: "حذف مقصد",
        message: `مقصد «${m.label || m.target}» حذف شود؟`,
        confirmText: "حذف",
        danger: true,
      }))
    )
      return;
    await fetch(`/api/messengers?id=${m.id}`, { method: "DELETE" });
    load();
  };

  const test = async (id: number) => {
    setTesting(id);
    setMsg("⏳ در حال ارسال پیام آزمایشی...");
    const res = await fetch("/api/messengers/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const d = await res.json().catch(() => ({}));
    setTesting(null);
    setMsg(d.ok ? `✅ ارسال موفق (${d.via === "proxy" ? "از طریق پروکسی" : "مستقیم"})` : `✖ ${d.detail ?? "ناموفق"}`);
    load();
  };

  const testAll = async () => {
    setMsg("⏳ ارسال پیام آزمایشی به همه مقصدهای فعال...");
    const res = await fetch("/api/messengers/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    const d = await res.json().catch(() => ({}));
    setMsg(
      d.summary
        ? `${d.sent}/${d.total} موفق — ${d.summary}`.slice(0, 400)
        : `✖ ${d.error ?? "ارسال ناموفق"}`,
    );
    load();
  };

  const discover = async () => {
    setChatBusy(true);
    setChats([]);
    setMsg("⏳ دریافت لیست چت‌های ربات...");
    const res = await fetch("/api/messengers/updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: tab, token: form.token }),
    });
    const d = await res.json().catch(() => ({}));
    setChatBusy(false);
    setChats(d.chats ?? []);
    setMsg(d.ok ? `✅ ${(d.chats ?? []).length} چت پیدا شد — روی هرکدام بزنید` : `✖ ${d.detail ?? "ناموفق"}`);
  };

  const saveProxy = async (next: Proxy) => {
    setProxy(next);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "messagingProxy", value: next }),
    });
    setMsg(res.ok ? "✅ تنظیمات پروکسی ذخیره شد" : "✖ خطا در ذخیره");
  };

  const testProxy = async () => {
    setMsg("⏳ بررسی پروکسی...");
    const res = await fetch("/api/messengers/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pingProxy: true }),
    });
    const d = await res.json().catch(() => ({}));
    setWorkerVersion(d.version ?? "");
    setMsg(d.detail ?? (d.ok ? "پروکسی در دسترس است" : "پروکسی پاسخ نداد"));
  };

  const copyWorker = async () => {
    const code = await fetch("/cloudflare-worker.js").then((r) => r.text()).catch(() => "");
    if (!code) return setMsg("✖ دریافت کد ورکر ناموفق بود");
    await navigator.clipboard.writeText(code).catch(() => window.open("/cloudflare-worker.js", "_blank"));
    setMsg("✅ کد ورکر کپی شد — در Cloudflare جایگزین کنید و Deploy بزنید");
  };

  const tabRows = rows.filter((r) => r.platform === tab);
  const activeCount = rows.filter((r) => r.enabled).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle icon="📨">ارسال خودکار سفارشات به پیام‌رسان‌ها</SectionTitle>
        <div className="flex gap-2">
          <Badge tone={activeCount ? "green" : "amber"}>{toPersianDigits(activeCount)} مقصد فعال</Badge>
          <Button variant="soft" onClick={testAll}>
            🧪 تست همه
          </Button>
        </div>
      </div>
      {msg ? <Alert kind={msg.startsWith("✖") ? "error" : "success"}>{msg}</Alert> : null}

      {/* ------------------ ارسال خودکار ------------------ */}
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-black text-slate-800">🚀 ارسال خودکار سفارش‌ها</span>
          <button
            onClick={async () => {
              const next = !autoSend;
              if (
                !(await confirm({
                  title: next ? "فعال‌سازی ارسال خودکار" : "غیرفعال‌سازی ارسال خودکار",
                  message: next
                    ? "هر سفارش جدید بلافاصله پس از ثبت، خودکار به همه پیام‌رسان‌های فعال ارسال شود؟"
                    : "ارسال خودکار خاموش شود؟ نمایندگان باید دستی ارسال کنند.",
                  confirmText: next ? "فعال کن" : "خاموش کن",
                }))
              )
                return;
              setAutoSend(next);
              const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: "autoSendOrders", value: { enabled: next } }),
              });
              setMsg(res.ok ? (next ? "✅ ارسال خودکار فعال شد" : "✅ ارسال خودکار خاموش شد") : "✖ خطا");
            }}
            className={`rounded-xl px-4 py-2 text-xs font-bold ${
              autoSend ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            {autoSend ? "✅ فعال — هر سفارش خودکار ارسال می‌شود" : "⛔ غیرفعال — فقط ارسال دستی"}
          </button>
          <span className="text-[11px] text-slate-500">
            علاوه بر این، نماینده می‌تواند از پنجره جزئیات سفارش، دستی هم ارسال کند.
          </span>
        </div>
      </Card>

      {/* ------------------ تب پیام‌رسان‌ها ------------------ */}
      <div className="flex flex-wrap gap-1 rounded-2xl bg-slate-200 p-1">
        {PLATFORMS.map((p) => {
          const count = rows.filter((r) => r.platform === p.key).length;
          const on = rows.some((r) => r.platform === p.key && r.enabled);
          return (
            <button
              key={p.key}
              onClick={() => setTab(p.key)}
              className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                tab === p.key ? "bg-white text-teal-700 shadow" : "text-slate-600 hover:bg-white/50"
              }`}
            >
              {p.icon} {p.label}
              {count ? (
                <span className={`mr-1 rounded-md px-1.5 text-[10px] ${on ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                  {toPersianDigits(count)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* ------------------ راهنمای همان پیام‌رسان ------------------ */}
      <Card>
        <h3 className="mb-2 text-sm font-black text-slate-800">
          {meta.icon} راهنمای دریافت توکن {meta.label}
        </h3>
        <ol className="list-inside list-decimal space-y-1 text-[11px] leading-6 text-slate-600">
          {meta.guide.map((g, i) => (
            <li key={i}>{g}</li>
          ))}
        </ol>
        {sysTokens[tab] ? (
          <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-800">
            ✅ توکن پیش‌فرض این پیام‌رسان در سامانه ثبت شده است ({sysTokens[tab]}) — فیلد توکن را خالی بگذارید.
          </p>
        ) : null}
      </Card>

      {/* ------------------ فرم افزودن مقصد ------------------ */}
      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">➕ افزودن مقصد جدید {meta.label}</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="عنوان (برای شناسایی)">
            <Input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="مثلاً گروه سفارشات"
            />
          </Field>

          {tab === "whatsapp" ? (
            <Field label="ارائه‌دهنده سرویس" hint={WA_PROVIDERS.find((p) => p.key === form.provider)?.hint}>
              <select
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              >
                {WA_PROVIDERS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="نوع مقصد">
              <select
                value={form.targetType}
                onChange={(e) => setForm({ ...form, targetType: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              >
                <option value="group">گروه</option>
                <option value="channel">کانال</option>
                <option value="phone">چت شخصی</option>
              </select>
            </Field>
          )}

          <Field label="شناسه مقصد" required hint={meta.targetHint}>
            <Input value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className="text-left" />
          </Field>

          <Field label="توکن / کلید API" hint={meta.tokenHint}>
            <Input value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} className="text-left" />
          </Field>

          {tab === "whatsapp" && form.provider === "custom" ? (
            <div className="sm:col-span-2">
              <Field label="آدرس سرویس سفارشی" hint="نمونه: https://api.example.com/send?to={phone}&msg={text}&key={token}">
                <Input value={form.apiUrl} onChange={(e) => setForm({ ...form, apiUrl: e.target.value })} className="text-left" />
              </Field>
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {tab === "telegram" || tab === "bale" ? (
            <Button variant="soft" onClick={discover} disabled={chatBusy}>
              {chatBusy ? "⏳ ..." : "🔎 دریافت خودکار chat_id"}
            </Button>
          ) : null}
          <div className="flex-1" />
          <Button onClick={add}>➕ افزودن مقصد</Button>
        </div>

        {chats.length ? (
          <div className="mt-3 rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200">
            <div className="mb-1 text-[11px] font-bold text-slate-600">چت‌های اخیر ربات:</div>
            <div className="flex flex-wrap gap-1">
              {chats.map((c) => (
                <button
                  key={c.id}
                  onClick={() =>
                    setForm({ ...form, target: c.id, label: c.title, targetType: c.type === "شخصی" ? "phone" : "group" })
                  }
                  className="rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-teal-700 ring-1 ring-teal-200 hover:bg-teal-50"
                >
                  {c.type === "شخصی" ? "👤" : "👥"} {c.title}
                  <span className="mr-1 text-[10px] text-slate-400" dir="ltr">
                    {c.id}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      {/* ------------------ مقصدهای همین پیام‌رسان ------------------ */}
      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">
          مقصدهای {meta.label} ({toPersianDigits(tabRows.length)})
        </h3>
        {tabRows.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">هنوز مقصدی برای {meta.label} تعریف نشده است</p>
        ) : (
          <div className="space-y-2">
            {tabRows.map((m) => (
              <div key={m.id} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-black text-slate-800">{m.label || "بدون عنوان"}</span>
                  <Badge tone={m.enabled ? "green" : "amber"}>{m.enabled ? "فعال" : "غیرفعال"}</Badge>
                  <span className="rounded bg-white px-2 py-0.5 text-[10px] text-slate-500" dir="ltr">
                    {m.target}
                  </span>
                  {m.provider ? (
                    <span className="rounded bg-white px-2 py-0.5 text-[10px] text-slate-500">
                      {WA_PROVIDERS.find((p) => p.key === m.provider)?.label ?? m.provider}
                    </span>
                  ) : null}
                  <div className="mr-auto flex flex-wrap gap-1">
                    <button
                      onClick={() => test(m.id)}
                      disabled={testing === m.id}
                      className="rounded-lg bg-sky-100 px-2 py-1 text-[11px] font-bold text-sky-700 disabled:opacity-50"
                    >
                      {testing === m.id ? "..." : "🧪 تست ارسال"}
                    </button>
                    <button
                      onClick={() => patch({ id: m.id, enabled: !m.enabled })}
                      className="rounded-lg bg-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700"
                    >
                      {m.enabled ? "غیرفعال کن" : "فعال کن"}
                    </button>
                    <button
                      onClick={() => setShowToken((s) => ({ ...s, [m.id]: !s[m.id] }))}
                      className="rounded-lg bg-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700"
                    >
                      {showToken[m.id] ? "🙈 توکن" : "👁 توکن"}
                    </button>
                    <button
                      onClick={() => remove(m)}
                      className="rounded-lg bg-rose-100 px-2 py-1 text-[11px] font-bold text-rose-700"
                    >
                      حذف
                    </button>
                  </div>
                </div>

                {showToken[m.id] ? (
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-bold text-slate-500">توکن</span>
                      <Input
                        value={m.token}
                        onChange={(e) => setRows((p) => p.map((x) => (x.id === m.id ? { ...x, token: e.target.value } : x)))}
                        onBlur={() => patch({ id: m.id, token: m.token })}
                        className="text-left font-mono text-xs"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-bold text-slate-500">شناسه مقصد</span>
                      <Input
                        value={m.target}
                        onChange={(e) => setRows((p) => p.map((x) => (x.id === m.id ? { ...x, target: e.target.value } : x)))}
                        onBlur={() => patch({ id: m.id, target: m.target })}
                        className="text-left font-mono text-xs"
                      />
                    </label>
                  </div>
                ) : null}

                {m.lastStatus ? (
                  <div
                    className={`mt-2 rounded-lg px-2 py-1 text-[10px] ${
                      m.lastStatus.startsWith("✔") ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {m.lastStatus}
                    {m.lastOkAt ? <span className="mr-2 text-slate-400">آخرین موفق: {tehranDateTime(m.lastOkAt)}</span> : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ------------------ پروکسی ------------------ */}
      <Card>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-700">🌐 پروکسی ارسال (برای سرورهای خارج از ایران)</h3>
          <Badge tone={proxy.enabled ? "green" : "amber"}>{proxy.enabled ? "فعال" : "غیرفعال"}</Badge>
        </div>
        <Alert kind="info">
          سرور Render به تلگرام/بله/ایتا دسترسی ندارد. با فعال بودن پروکسی، پیام‌ها از طریق Cloudflare Worker شما
          ارسال می‌شوند. اگر ارسال مستقیم موفق شود، پروکسی استفاده نمی‌شود.
        </Alert>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Field label="آدرس پروکسی">
              <Input value={proxy.url} onChange={(e) => setProxy({ ...proxy, url: e.target.value })} className="text-left" />
            </Field>
          </div>
          <Field label="رمز اختیاری">
            <Input value={proxy.secret ?? ""} onChange={(e) => setProxy({ ...proxy, secret: e.target.value })} />
          </Field>
        </div>
        {workerVersion === "old" ? (
          <Alert kind="error">
            ورکر فعلی نسخه قدیمی است و توکن ارسالی را نادیده می‌گیرد. با دکمه «کپی کد ورکر» نسخه جدید را جایگزین کنید.
          </Alert>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => saveProxy(proxy)}>💾 ذخیره</Button>
          <Button variant={proxy.enabled ? "danger" : "success"} onClick={() => saveProxy({ ...proxy, enabled: !proxy.enabled })}>
            {proxy.enabled ? "غیرفعال کردن" : "فعال کردن"}
          </Button>
          <Button variant="ghost" onClick={testProxy}>
            🔌 تست اتصال
          </Button>
          <Button variant="soft" onClick={copyWorker}>
            📋 کپی کد ورکر
          </Button>
        </div>
      </Card>

      {/* ------------------ پیامک ------------------ */}
      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">📱 سرویس پیامک (تایید سیم‌کارت)</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Field label="سرویس‌دهنده">
            <select
              value={sms.provider}
              onChange={(e) => setSms({ ...sms, provider: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            >
              <option value="kavenegar">کاوه‌نگار</option>
              <option value="smsir">SMS.ir</option>
              <option value="melipayamak">ملی‌پیامک</option>
              <option value="custom">آدرس سفارشی</option>
            </select>
          </Field>
          <Field label="کلید API">
            <Input value={sms.apiKey} onChange={(e) => setSms({ ...sms, apiKey: e.target.value })} className="text-left" />
          </Field>
          <Field label="شماره فرستنده">
            <Input value={sms.sender} onChange={(e) => setSms({ ...sms, sender: e.target.value })} className="text-left" />
          </Field>
          <Field label="کد الگو">
            <Input value={sms.pattern} onChange={(e) => setSms({ ...sms, pattern: e.target.value })} className="text-left" />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <input
              type="checkbox"
              className="size-4 accent-teal-600"
              checked={sms.enabled}
              onChange={(e) => setSms({ ...sms, enabled: e.target.checked })}
            />
            فعال باشد
          </label>
          <Button
            onClick={async () => {
              const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: "sms", value: sms }),
              });
              setMsg(res.ok ? "✅ تنظیمات پیامک ذخیره شد" : "✖ خطا");
            }}
          >
            💾 ذخیره
          </Button>
        </div>
      </Card>

      {/* ------------------ لاگ ------------------ */}
      <Card>
        <SectionTitle icon="📜">آخرین ارسال‌ها</SectionTitle>
        <div className="max-h-72 space-y-1 overflow-y-auto text-xs">
          {logs.map((l) => (
            <div key={l.id} className={`rounded-lg px-3 py-1.5 ${l.ok ? "bg-emerald-50" : "bg-rose-50"}`}>
              <span className={l.ok ? "text-emerald-700" : "text-rose-700"}>{l.ok ? "✔" : "✖"}</span>{" "}
              <b>{PLATFORMS.find((p) => p.key === l.platform)?.label ?? l.platform}</b> → <span dir="ltr">{l.target}</span>
              <div className="text-[10px] text-slate-600">{l.detail}</div>
              <span className="text-[10px] text-slate-400">{tehranDateTime(l.createdAt)}</span>
            </div>
          ))}
          {logs.length === 0 ? <p className="text-slate-400">هنوز ارسالی انجام نشده است</p> : null}
        </div>
      </Card>
    </div>
  );
}
