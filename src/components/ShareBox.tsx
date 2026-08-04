"use client";

import { useState } from "react";
import { Alert, Button } from "./ui";

/**
 * ارسال بدون توکن: متن سفارش را در پیام‌رسان‌های نصب‌شده روی همان دستگاه باز می‌کند.
 * برای زمانی که هنوز توکن رباتی تنظیم نشده است.
 */
export default function ShareBox({ text, title = "ارسال دستی به پیام‌رسان‌ها" }: { text: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent(text);

  const targets = [
    { key: "wa", label: "واتساپ", icon: "🟢", url: `https://wa.me/?text=${enc}` },
    { key: "tg", label: "تلگرام", icon: "🔵", url: `https://t.me/share/url?url=&text=${enc}` },
    { key: "bale", label: "بله", icon: "🟣", url: `https://ble.ir/share/url?url=&text=${enc}` },
    { key: "eitaa", label: "ایتا", icon: "🟠", url: `https://eitaa.com/share/url?url=&text=${enc}` },
    { key: "sms", label: "پیامک", icon: "✉️", url: `sms:?&body=${enc}` },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <h4 className="mb-2 text-sm font-bold text-slate-700">📤 {title}</h4>
      <p className="mb-2 text-[11px] text-slate-500">
        بدون نیاز به هیچ توکنی — روی هر گزینه بزنید تا متن آماده در همان پیام‌رسان باز شود و فقط گیرنده را انتخاب کنید.
      </p>
      <div className="flex flex-wrap gap-2">
        {targets.map((t) => (
          <a
            key={t.key}
            href={t.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-teal-50"
          >
            {t.icon} {t.label}
          </a>
        ))}
        <Button variant="soft" onClick={copy}>
          📋 کپی متن
        </Button>
      </div>
      {copied ? (
        <div className="mt-2">
          <Alert kind="success">متن سفارش کپی شد — در هر برنامه‌ای می‌توانید بچسبانید.</Alert>
        </div>
      ) : null}
      <details className="mt-2">
        <summary className="cursor-pointer text-[11px] font-bold text-teal-700">مشاهده متن</summary>
        <pre className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl bg-white p-2 text-[11px] text-slate-700 ring-1 ring-slate-200">
          {text}
        </pre>
      </details>
    </div>
  );
}
