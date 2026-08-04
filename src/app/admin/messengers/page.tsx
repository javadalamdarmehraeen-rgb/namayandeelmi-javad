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
type Proxy = { url: string; enabled: boolean; secret?: string };
type Chat = { id: string; title: string; type: string };

const blank = { platform: "bale", label: "", targetType: "group", target: "", token: "", enabled: true };

export default function MessengersPage() {
  const [rows, setRows] = useState<M[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [form, setForm] = useState({ ...blank });
  const [proxy, setProxy] = useState<Proxy>({ url: "", enabled: true, secret: "" });
  const [msg, setMsg] = useState("");
  const [showToken, setShowToken] = useState<Record<number, boolean>>({});
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatBusy, setChatBusy] = useState(false);
  const [sysTokens, setSysTokens] = useState<Record<string, string>>({});
  const [workerVersion, setWorkerVersion] = useState<"new" | "old" | "down" | "">("");
  const [workerCode, setWorkerCode] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/messengers", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setRows(d.rows ?? []);
      setLogs(d.logs ?? []);
      if (d.proxy) setProxy(d.proxy);
    }
  }, []);

  useEffect(() => {
    load();
    fetch("/api/messengers/updates", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setSysTokens(d?.tokens ?? {}))
      .catch(() => undefined);
  }, [load]);

  const discover = async () => {
    setChatBusy(true);
    setChats([]);
    setMsg("⏳ در حال دریافت لیست چت‌های ربات...");
    const res = await fetch("/api/messengers/updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: form.platform, token: form.token }),
    });
    const d = await res.json().catch(() => ({}));
    setChatBusy(false);
    setChats(d.chats ?? []);
    setMsg(
      d.ok
        ? `✅ ${(d.chats ?? []).length} چت پیدا شد — روی هرکدام بزنید تا مقصد پر شود`
        : `✖ ${d.detail ?? "دریافت ناموفق"}`,
    );
  };

  const saveProxy = async (next: Proxy) => {
    setProxy(next);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "messagingProxy", value: next }),
    });
    setMsg(res.ok ? "✅ تنظیمات پروکسی ذخیره شد" : "✖ خطا در ذخیره پروکسی");
  };

  const add = async () => {
    const res = await fetch("/api/messengers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ ...blank });
      setMsg("✅ مقصد جدید ثبت شد");
      load();
    } else setMsg("✖ خطا در ثبت مقصد");
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

  const test = async (id: number) => {
    setMsg("⏳ در حال ارسال پیام آزمایشی...");
    const res = await fetch("/api/messengers/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const d = await res.json().catch(() => ({}));
    setMsg(d.ok ? "✅ پیام آزمایشی با موفقیت ارسال شد" : `✖ ${d.detail ?? d.error ?? "ارسال ناموفق"}`);
    load();
  };

  const testProxy = async () => {
    setMsg("⏳ بررسی اتصال پروکسی...");
    const res = await fetch("/api/messengers/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pingProxy: true }),
    });
    const d = await res.json().catch(() => ({}));
    setWorkerVersion(d.version ?? "");
    setMsg(d.ok ? `${d.detail ?? "پروکسی در دسترس است"}` : `✖ ${d.detail ?? "پروکسی پاسخ نداد"}`);
  };

  const copyWorker = async () => {
    let code = workerCode;
    if (!code) {
      code = await fetch("/cloudflare-worker.js")
        .then((r) => r.text())
        .catch(() => "");
      setWorkerCode(code);
    }
    if (!code) {
      setMsg("✖ دریافت کد ورکر ناموفق بود");
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      setMsg("✅ کد کامل ورکر کپی شد — در Cloudflare جایگزین کد فعلی کنید و Deploy بزنید");
    } catch {
      window.open("/cloudflare-worker.js", "_blank");
    }
  };

  return (
    <div className="space-y-4">
      <SectionTitle icon="📨">ارسال سفارشات به پیام‌رسان‌ها</SectionTitle>
      {msg ? <Alert kind={msg.startsWith("✖") ? "error" : "success"}>{msg}</Alert> : null}

      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">🟣 ربات بله (آماده استفاده)</h3>
        <Alert kind="success">
          توکن ربات بله شما در سامانه ثبت شده است و نیازی به وارد کردن مجدد آن نیست. برای فعال شدن ارسال خودکار فقط
          کافی است: <b>۱)</b> در بله ربات{" "}
          <a href="https://ble.ir/namayandeelmibot" target="_blank" rel="noreferrer" className="font-bold underline">
            namayandeelmibot@
          </a>{" "}
          را باز کنید و دکمه «شروع» را بزنید (یا ربات را در گروه موردنظر عضو و یک پیام ارسال کنید). <b>۲)</b> در فرم
          پایین، پیام‌رسان را «بله» انتخاب کرده و دکمه «🔎 دریافت خودکار chat_id» را بزنید تا چت شما یا گروه نمایش داده
          شود. <b>۳)</b> روی آن بزنید و «افزودن مقصد» را کلیک کنید. از این پس هر سفارش خودکار به بله ارسال می‌شود.
        </Alert>
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">✅ ارسال بدون توکن (همیشه در دسترس)</h3>
        <Alert kind="success">
          نیازی به توکن نیست! در صفحه «سفارشات»، روی نام هر داروخانه بزنید؛ پایین پنجره جزئیات، بخش «📤 ارسال دستی به
          پیام‌رسان‌ها» قرار دارد که متن کامل سفارش را آماده می‌کند و با یک کلیک آن را در واتساپ، تلگرام، بله، ایتا یا
          پیامک باز می‌کند. دکمه «کپی متن» هم برای چسباندن در هر برنامه‌ای موجود است.
        </Alert>
        <div className="mt-3 rounded-xl bg-slate-50 p-3">
          <h4 className="mb-1 text-xs font-black text-slate-700">🎯 اگر بعداً ارسال کاملاً خودکار خواستید:</h4>
          <ol className="list-inside list-decimal space-y-1 text-[11px] leading-6 text-slate-600">
            <li>
              <b>تلگرام:</b> در تلگرام به <span dir="ltr">@BotFather</span> پیام دهید → دستور <code>/newbot</code> →
              نام و آیدی ربات را بدهید → توکن به شما داده می‌شود (رایگان).
            </li>
            <li>
              <b>بله:</b> در بله به <span dir="ltr">@BotFather</span> پیام دهید → <code>/newbot</code> → توکن دریافت
              کنید.
            </li>
            <li>
              <b>ایتا:</b> در سایت <span dir="ltr">eitaayar.ir</span> ثبت‌نام کنید و توکن رایگان بگیرید.
            </li>
            <li>
              برای گرفتن <b>chat_id</b>: ربات را در گروه عضو کنید، یک پیام بفرستید، سپس آدرس
              <span dir="ltr"> https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates </span> را باز کنید و مقدار
              <code> chat.id </code> را کپی کنید.
            </li>
            <li>توکن و chat_id را در فرم پایین همین صفحه وارد کرده و دکمه «تست ارسال» را بزنید.</li>
          </ol>
        </div>
      </Card>

      <Card>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-700">🌐 پروکسی ارسال (Cloudflare Worker)</h3>
          <Badge tone={proxy.enabled ? "green" : "amber"}>{proxy.enabled ? "فعال" : "غیرفعال"}</Badge>
        </div>
        <Alert kind="info">
          سرورهای خارج از ایران (مثل Render) به تلگرام/بله/ایتا دسترسی ندارند. با فعال بودن پروکسی، پیام‌ها از طریق
          Cloudflare Worker شما ارسال می‌شوند. <b>مهم:</b> ورکر فعلی شما توکن را از داخل خودش می‌خواند؛ نسخه کامل‌تری
          آماده کرده‌ایم که توکن و chat_id را از همین صفحه می‌گیرد (و واتساپ را هم پشتیبانی می‌کند). فایل را از{" "}
          <a href="/cloudflare-worker.js" target="_blank" rel="noreferrer" className="font-bold underline">
            اینجا دانلود
          </a>{" "}
          کرده و در Cloudflare جایگزین کد فعلی ورکر کنید. اگر ترجیح می‌دهید توکن‌ها داخل ورکر بمانند، فیلد «توکن» را
          اینجا خالی بگذارید.
        </Alert>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Field label="آدرس پروکسی">
              <Input
                value={proxy.url}
                onChange={(e) => setProxy({ ...proxy, url: e.target.value })}
                placeholder="https://xxx.workers.dev/"
                className="text-left"
              />
            </Field>
          </div>
          <Field label="رمز اختیاری پروکسی (x-proxy-secret)">
            <Input value={proxy.secret ?? ""} onChange={(e) => setProxy({ ...proxy, secret: e.target.value })} />
          </Field>
        </div>
        {workerVersion === "old" ? (
          <div className="mt-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-300">
            <p className="text-xs font-bold text-amber-900">
              ورکر فعلی شما نسخه قدیمی است و توکن ارسالی از برنامه را نادیده می‌گیرد. دو راه دارید:
            </p>
            <ol className="mt-1 list-inside list-decimal space-y-1 text-[11px] text-amber-900">
              <li>
                <b>ساده‌ترین راه:</b> در کد ورکر فعلی، مقدار <code>BALE_BOT_TOKEN</code> را برابر توکن ربات بله و
                <code> BALE_CHAT_ID</code> را برابر آیدی گروه/چت خود بگذارید و Deploy کنید.
              </li>
              <li>
                <b>راه بهتر:</b> با دکمه زیر کد کامل نسخه جدید را کپی و در Cloudflare جایگزین کنید تا توکن‌ها از همین
                صفحه مدیریت شوند و کشف خودکار chat_id هم کار کند.
              </li>
            </ol>
          </div>
        ) : null}
        {workerVersion === "new" ? (
          <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200">
            ✅ ورکر نسخه جدید فعال است — ارسال خودکار بله آماده است.
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => saveProxy(proxy)}>💾 ذخیره پروکسی</Button>
          <Button variant="soft" onClick={copyWorker}>
            📋 کپی کد کامل ورکر
          </Button>
          <a
            href="/cloudflare-worker.js"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-300"
          >
            ⬇️ دانلود فایل ورکر
          </a>
          <Button variant={proxy.enabled ? "danger" : "success"} onClick={() => saveProxy({ ...proxy, enabled: !proxy.enabled })}>
            {proxy.enabled ? "غیرفعال کردن پروکسی" : "فعال کردن پروکسی"}
          </Button>
          <Button variant="ghost" onClick={testProxy}>
            🔌 تست اتصال پروکسی
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">افزودن مقصد جدید</h3>
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
              <option value="phone">شماره / چت شخصی</option>
              <option value="group">گروه / کانال</option>
            </select>
          </Field>
          <Field label="شناسه مقصد (chat_id)" hint="گروه‌ها معمولاً با - شروع می‌شوند">
            <Input value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className="text-left" />
          </Field>
          <Field label="توکن ربات" hint="اگر در خود ورکر توکن گذاشته‌اید، می‌تواند خالی بماند">
            <Input value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} className="text-left" />
          </Field>
          <Field label="عنوان">
            <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </Field>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          {PLATFORMS.find((p) => p.key === form.platform)?.hint}
        </p>
        {sysTokens[form.platform] ? (
          <p className="mt-1 text-[11px] font-bold text-emerald-700">
            ✅ توکن پیش‌فرض این پیام‌رسان در سامانه ثبت شده است ({sysTokens[form.platform]}) — فیلد توکن را خالی
            بگذارید.
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {form.platform === "bale" || form.platform === "telegram" ? (
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
                    setForm({
                      ...form,
                      target: c.id,
                      label: c.title,
                      targetType: c.type === "شخصی" ? "phone" : "group",
                    })
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

      <Card>
        <div className="scroll-x">
          <table className="w-full min-w-[820px] text-right text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                <th className="px-2 py-2">پیام‌رسان</th>
                <th className="px-2 py-2">عنوان</th>
                <th className="px-2 py-2">نوع</th>
                <th className="px-2 py-2">مقصد</th>
                <th className="px-2 py-2">توکن</th>
                <th className="px-2 py-2">وضعیت</th>
                <th className="px-2 py-2">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-b border-slate-100">
                  <td className="px-2 py-2 font-bold">{PLATFORMS.find((p) => p.key === m.platform)?.label ?? m.platform}</td>
                  <td className="px-2 py-2">{m.label || "—"}</td>
                  <td className="px-2 py-2">{m.targetType === "group" ? "گروه" : "شماره"}</td>
                  <td className="px-2 py-2 text-left" dir="ltr">
                    {m.target}
                  </td>
                  <td className="px-2 py-2">
                    <button
                      onClick={() => setShowToken((s) => ({ ...s, [m.id]: !s[m.id] }))}
                      className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[10px]"
                    >
                      {showToken[m.id] ? (m.token || "—") : "•••••• 👁"}
                    </button>
                  </td>
                  <td className="px-2 py-2">
                    <Badge tone={m.enabled ? "green" : "amber"}>{m.enabled ? "فعال" : "غیرفعال"}</Badge>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => test(m.id)}
                        className="rounded-lg bg-sky-100 px-2 py-1 text-[11px] font-bold text-sky-700"
                      >
                        تست ارسال
                      </button>
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
                  <td colSpan={7} className="py-6 text-center text-slate-400">
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
              {PLATFORMS.find((p) => p.key === l.platform)?.label ?? l.platform} → {l.target}
              <div className="text-[10px] text-slate-500">{l.detail}</div>
              <span className="text-[10px] text-slate-400">{tehranDateTime(l.createdAt)}</span>
            </div>
          ))}
          {logs.length === 0 ? <p className="text-slate-400">هنوز ارسالی انجام نشده است</p> : null}
        </div>
      </Card>
    </div>
  );
}
