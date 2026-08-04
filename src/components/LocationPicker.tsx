"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Badge, Button, Input } from "./ui";
import { toPersianDigits } from "@/lib/jalali";

const MapBox = dynamic(() => import("./MapBox"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[240px] items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-400">
      در حال بارگذاری نقشه...
    </div>
  ),
});

export type LatLng = { lat: number | null; lng: number | null; accuracy: number | null };

/**
 * انتخاب لوکیشن با دقت بالا:
 * دستگاه به مدت ۱۵ ثانیه چند نمونه GPS می‌گیرد و دقیق‌ترین نمونه (کمترین خطا) را نگه می‌دارد.
 * امکان جابجایی دستی نشانگر روی نقشه و ورود دستی مختصات هم وجود دارد.
 */
export default function LocationPicker({
  value,
  onChange,
  label,
  height = 260,
}: {
  value: LatLng;
  onChange: (v: LatLng) => void;
  label?: string;
  height?: number;
}) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const watchRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bestRef = useRef<number>(Number.POSITIVE_INFINITY);

  const stop = useCallback(() => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setBusy(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const locate = () => {
    if (!navigator.geolocation) {
      setStatus("مرورگر شما از موقعیت‌یاب پشتیبانی نمی‌کند");
      return;
    }
    if (!window.isSecureContext) {
      setStatus("⚠️ GPS فقط روی آدرس https فعال می‌شود");
    }
    stop();
    bestRef.current = Number.POSITIVE_INFINITY;
    setBusy(true);
    setStatus("📡 در حال دریافت موقعیت دقیق... (تا ۱۵ ثانیه)");
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const acc = pos.coords.accuracy ?? 9999;
        if (acc < bestRef.current) {
          bestRef.current = acc;
          onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: acc });
          setStatus(`دقت فعلی: ${Math.round(acc)} متر — برای دقت بیشتر چند لحظه صبر کنید`);
        }
        if (acc <= 8) {
          stop();
          setStatus(`✅ موقعیت با دقت ${Math.round(acc)} متر ثبت شد`);
        }
      },
      (err) => {
        stop();
        setStatus(
          err.code === 1
            ? "⛔ دسترسی به موقعیت رد شد. از تنظیمات مرورگر اجازه دسترسی بدهید."
            : "دریافت موقعیت ناموفق بود. GPS دستگاه را روشن کنید.",
        );
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );
    timerRef.current = setTimeout(() => {
      stop();
      setStatus(
        bestRef.current === Number.POSITIVE_INFINITY
          ? "موقعیتی دریافت نشد؛ روی نقشه نقطه را انتخاب کنید"
          : `✅ بهترین دقت به‌دست‌آمده: ${Math.round(bestRef.current)} متر`,
      );
    }, 15000);
  };

  const acc = value.accuracy ?? null;
  const accTone = acc === null ? "amber" : acc <= 20 ? "green" : acc <= 60 ? "amber" : "slate";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="soft" onClick={locate} disabled={busy}>
          {busy ? "⏳ در حال اندازه‌گیری..." : "📡 ثبت دقیق موقعیت فعلی"}
        </Button>
        {busy ? (
          <Button variant="ghost" onClick={() => { stop(); setStatus("اندازه‌گیری متوقف شد"); }}>
            توقف
          </Button>
        ) : null}
        {value.lat && value.lng ? (
          <Badge tone={accTone as "green" | "amber" | "slate"}>
            {acc ? `دقت ≈ ${toPersianDigits(Math.round(acc))} متر` : "ثبت شده"}
          </Badge>
        ) : (
          <Badge tone="amber">لوکیشن ثبت نشده</Badge>
        )}
      </div>
      {status ? <p className="text-[11px] text-slate-500">{status}</p> : null}
      <p className="text-[11px] text-slate-400">
        نکته: نشانگر روی نقشه قابل کشیدن است؛ برای اصلاح خطا آن را دقیقاً روی درب ورودی قرار دهید.
      </p>

      <MapBox
        height={height}
        draggable
        accuracy={acc}
        points={value.lat && value.lng ? [{ lat: value.lat, lng: value.lng, label: label || "لوکیشن" }] : []}
        onPick={(p) => onChange({ lat: p.lat, lng: p.lng, accuracy: 0 })}
      />

      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="عرض جغرافیایی (lat)"
          value={value.lat ?? ""}
          onChange={(e) => onChange({ ...value, lat: Number(e.target.value) || null })}
          className="text-left text-xs"
        />
        <Input
          placeholder="طول جغرافیایی (lng)"
          value={value.lng ?? ""}
          onChange={(e) => onChange({ ...value, lng: Number(e.target.value) || null })}
          className="text-left text-xs"
        />
      </div>
    </div>
  );
}
