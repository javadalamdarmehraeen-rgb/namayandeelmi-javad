"use client";

import { useState } from "react";
import { Alert, Button } from "./ui";

type Target = {
  key: string;
  label: string;
  icon: string;
  color: string;
  /** اسکیم اپ موبایل (اگر نصب باشد مستقیم باز می‌شود) */
  app?: (t: string) => string;
  /** آدرس وب به عنوان جایگزین */
  web: (t: string) => string;
};

const TARGETS: Target[] = [
  {
    key: "bale",
    label: "بله",
    icon: "🟣",
    color: "bg-purple-50 text-purple-800 ring-purple-200 hover:bg-purple-100",
    app: (t) => `ble://share?text=${t}`,
    web: (t) => `https://ble.ir/share/url?url=&text=${t}`,
  },
  {
    key: "eitaa",
    label: "ایتا",
    icon: "🟠",
    color: "bg-orange-50 text-orange-800 ring-orange-200 hover:bg-orange-100",
    app: (t) => `eitaa://share?text=${t}`,
    web: (t) => `https://eitaa.com/share/url?url=&text=${t}`,
  },
  {
    key: "whatsapp",
    label: "واتساپ",
    icon: "🟢",
    color: "bg-emerald-50 text-emerald-800 ring-emerald-200 hover:bg-emerald-100",
    app: (t) => `whatsapp://send?text=${t}`,
    web: (t) => `https://wa.me/?text=${t}`,
  },
  {
    key: "telegram",
    label: "تلگرام",
    icon: "🔵",
    color: "bg-sky-50 text-sky-800 ring-sky-200 hover:bg-sky-100",
    app: (t) => `tg://msg?text=${t}`,
    web: (t) => `https://t.me/share/url?url=&text=${t}`,
  },
  {
    key: "sms",
    label: "پیامک",
    icon: "✉️",
    color: "bg-slate-100 text-slate-700 ring-slate-200 hover:bg-slate-200",
    web: (t) => `sms:?&body=${t}`,
  },
];

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * ارسال بدون توکن: متن سفارش را در پیام‌رسان نصب‌شده روی همان دستگاه باز می‌کند
 * و کاربر فقط مخاطب یا گروه را انتخاب می‌کند.
 */
export default function ShareBox({ text, title = "ارسال دستی به پیام‌رسان‌ها" }: { text: string; title?: string }) {
  const [note, setNote] = useState("");
  const enc = encodeURIComponent(text);

  const share = async (t: Target) => {
    // متن همیشه در حافظه کپی می‌شود تا اگر اپی متن را نگرفت، کاربر بچسباند
    await copyText(text);

    // اگر مرورگر از اشتراک‌گذاری بومی پشتیبانی کند (موبایل)، لیست اپ‌های نصب‌شده باز می‌شود
    if (t.app) {
      setNote(`در حال باز کردن ${t.label}... اگر باز نشد، متن کپی شده است و می‌توانید بچسبانید.`);
      const started = Date.now();
      const fallback = setTimeout(() => {
        // اگر اپ باز نشده باشد (صفحه هنوز فعال است) نسخه وب را باز می‌کنیم
        if (!document.hidden && Date.now() - started < 3000) {
          window.open(t.web(enc), "_blank", "noopener");
        }
      }, 1200);
      window.location.href = t.app(enc);
      window.addEventListener("pagehide", () => clearTimeout(fallback), { once: true });
      return;
    }
    window.open(t.web(enc), "_blank", "noopener");
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        /* کاربر لغو کرد */
      }
    }
    const ok = await copyText(text);
    setNote(ok ? "متن سفارش کپی شد — در هر برنامه‌ای می‌توانید بچسبانید." : "کپی ناموفق بود");
  };

  return (
    <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <h4 className="mb-1 text-sm font-bold text-slate-700">📤 {title}</h4>
      <p className="mb-2 text-[11px] text-slate-500">
        بدون نیاز به توکن — روی پیام‌رسان بزنید تا مستقیم باز شود و فقط مخاطب یا گروه را انتخاب کنید.
      </p>
      <div className="flex flex-wrap gap-2">
        {TARGETS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => share(t)}
            className={`rounded-xl px-3 py-2 text-xs font-bold ring-1 ${t.color}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
        <Button variant="soft" onClick={nativeShare}>
          📋 کپی / اشتراک‌گذاری
        </Button>
      </div>
      {note ? (
        <div className="mt-2">
          <Alert kind="success">{note}</Alert>
        </div>
      ) : null}
      <details className="mt-2">
        <summary className="cursor-pointer text-[11px] font-bold text-teal-700">مشاهده متن ارسالی</summary>
        <pre className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl bg-white p-2 text-[11px] text-slate-700 ring-1 ring-slate-200">
          {text}
        </pre>
      </details>
    </div>
  );
}
