"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, SectionTitle } from "@/components/ui";

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export default function InstallPage() {
  const [deferred, setDeferred] = useState<BIP | null>(null);
  const [installed, setInstalled] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIP);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferred) {
      setMsg("اگر دکمه نصب فعال نیست، از منوی مرورگر گزینه «Install app» یا «افزودن به صفحه اصلی» را بزنید.");
      return;
    }
    await deferred.prompt();
    const res = await deferred.userChoice;
    if (res.outcome === "accepted") setInstalled(true);
    setDeferred(null);
  };

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <SectionTitle icon="📲">دانلود و نصب اپلیکیشن</SectionTitle>
      {installed ? <Alert kind="success">✅ اپلیکیشن روی این دستگاه نصب شده است.</Alert> : null}
      {msg ? <Alert kind="info">{msg}</Alert> : null}

      <Card>
        <p className="mb-3 text-sm text-slate-600">
          این برنامه یک اپلیکیشن نصب‌شدنی (PWA) است؛ پس از نصب مثل یک برنامه معمولی آیکن مستقل دارد، بدون نوار مرورگر
          باز می‌شود و <b>آفلاین هم کار می‌کند</b>.
        </p>
        <Button onClick={install} className="w-full sm:w-auto">
          ⬇️ نصب اپلیکیشن روی این دستگاه
        </Button>
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-black text-slate-800">📱 اندروید</h3>
        <ol className="list-inside list-decimal space-y-1 text-xs leading-6 text-slate-600">
          <li>برنامه را در مرورگر Chrome باز کنید.</li>
          <li>دکمه «نصب اپلیکیشن» بالا را بزنید، یا از منوی ⋮ گزینه «Install app / افزودن به صفحه اصلی».</li>
          <li>آیکن برنامه روی صفحه اصلی گوشی ساخته می‌شود.</li>
        </ol>
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-black text-slate-800">🍎 آیفون (iOS)</h3>
        <ol className="list-inside list-decimal space-y-1 text-xs leading-6 text-slate-600">
          <li>برنامه را در Safari باز کنید.</li>
          <li>دکمه اشتراک‌گذاری (مربع با فلش) را بزنید.</li>
          <li>گزینه «Add to Home Screen» را انتخاب کنید.</li>
        </ol>
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-black text-slate-800">🖥 ویندوز</h3>
        <ol className="list-inside list-decimal space-y-1 text-xs leading-6 text-slate-600">
          <li>برنامه را در Chrome یا Edge باز کنید.</li>
          <li>آیکن نصب (⊕) در نوار آدرس، یا منو ⋮ → «Install».</li>
          <li>برنامه در منوی Start ویندوز ثبت می‌شود و مثل نرم‌افزار دسکتاپ اجرا می‌شود.</li>
        </ol>
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-black text-slate-800">📦 ساخت فایل APK اندروید</h3>
        <Alert kind="success">
          ✅ همه پیش‌نیازهای PWABuilder آماده است: آیکون‌های ۱۹۲ و ۵۱۲ پیکسل (PNG)، آیکون maskable، سرویس‌ورکر،
          اسکرین‌شات‌های دسکتاپ و موبایل، و شناسه (id) در manifest.
        </Alert>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-xs leading-6 text-slate-600">
          <li>
            وارد{" "}
            <a href="https://www.pwabuilder.com" target="_blank" rel="noreferrer" className="font-bold text-teal-700 underline">
              PWABuilder.com
            </a>{" "}
            شوید و آدرس <b>صفحه اصلی سایت</b> (نه صفحه login) را وارد کنید.
          </li>
          <li>دکمه Refresh/Retest را بزنید تا manifest جدید خوانده شود — اخطارها برطرف شده‌اند.</li>
          <li>روی «Package For Stores» → Android بزنید و فایل APK/AAB را دانلود کنید.</li>
          <li>برای تست سریع می‌توانید «Download Test Package» را بزنید و APK را مستقیم روی گوشی نصب کنید.</li>
        </ol>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="https://www.pwabuilder.com/reportcard?site="
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-teal-600 px-3 py-2 text-xs font-bold text-white"
            onClick={(e) => {
              e.preventDefault();
              window.open(`https://www.pwabuilder.com/reportcard?site=${window.location.origin}/`, "_blank");
            }}
          >
            🚀 ساخت APK در PWABuilder
          </a>
          <a
            href="/manifest.webmanifest"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-300"
          >
            مشاهده manifest
          </a>
        </div>
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-black text-slate-800">🎨 لوگو و آیکون‌های اپلیکیشن</h3>
        <div className="flex flex-wrap items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="آیکون ۱۹۲" className="size-20 rounded-2xl ring-1 ring-slate-200" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/maskable-512.png" alt="آیکون maskable" className="size-20 rounded-2xl ring-1 ring-slate-200" />
          <div className="text-xs leading-6 text-slate-600">
            آیکون‌های ۹۶ تا ۱۰۲۴ پیکسل به‌همراه نسخه maskable و apple-touch-icon از لوگوی کپسول ساخته شده‌اند.
          </div>
        </div>
      </Card>
    </main>
  );
}
