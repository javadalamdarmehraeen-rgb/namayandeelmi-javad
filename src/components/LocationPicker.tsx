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
type Hit = { label: string; lat: number; lng: number; type: string };

/**
 * انتخاب لوکیشن با سه روش:
 *   ۱) جستجوی آدرس روی نقشه (خودکار + دکمه جستجو)
 *   ۲) دریافت موقعیت دقیق GPS (نمونه‌برداری ۱۵ ثانیه‌ای)
 *   ۳) کلیک یا کشیدن نشانگر روی نقشه / ورود دستی مختصات
 */
export default function LocationPicker({
  value,
  onChange,
  label,
  height = 260,
  /** متن پیشنهادی برای جستجو (مثلاً نام داروخانه + شهر) */
  suggestQuery = "",
}: {
  value: LatLng;
  onChange: (v: LatLng) => void;
  label?: string;
  height?: number;
  suggestQuery?: string;
}) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  // --- جستجوی آدرس ---
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchMsg, setSearchMsg] = useState("");
  const [openList, setOpenList] = useState(false);
  const [address, setAddress] = useState("");

  const watchRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bestRef = useRef<number>(Number.POSITIVE_INFINITY);
  const boxRef = useRef<HTMLDivElement>(null);

  /* ------------------------- جستجوی آدرس ------------------------- */

  const runSearch = useCallback(async (q: string, silent = false) => {
    const term = q.trim();
    if (term.length < 2) {
      setHits([]);
      if (!silent) setSearchMsg("حداقل ۲ حرف وارد کنید");
      return;
    }
    setSearching(true);
    if (!silent) setSearchMsg("در حال جستجو...");
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(term)}`, { cache: "no-store" });
      const d = await res.json();
      const list: Hit[] = d.results ?? [];
      setHits(list);
      setOpenList(list.length > 0);
      setSearchMsg(
        list.length ? `${toPersianDigits(list.length)} نتیجه — یکی را انتخاب کنید` : "نتیجه‌ای یافت نشد",
      );
    } catch {
      setSearchMsg("جستجو ناموفق بود — می‌توانید روی نقشه نقطه را انتخاب کنید");
    } finally {
      setSearching(false);
    }
  }, []);

  /** جستجوی خودکار پس از توقف تایپ */
  useEffect(() => {
    if (autoRef.current) clearTimeout(autoRef.current);
    const term = query.trim();
    if (term.length < 3) {
      setHits([]);
      return;
    }
    autoRef.current = setTimeout(() => void runSearch(term, true), 800);
    return () => {
      if (autoRef.current) clearTimeout(autoRef.current);
    };
  }, [query, runSearch]);

  /** بستن فهرست با کلیک بیرون */
  useEffect(() => {
    if (!openList) return;
    const h = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpenList(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [openList]);

  const pickHit = (h: Hit) => {
    onChange({ lat: h.lat, lng: h.lng, accuracy: 0 });
    setQuery(h.label);
    setAddress(h.label);
    setOpenList(false);
    setSearchMsg("✅ موقعیت روی نقشه تنظیم شد — در صورت نیاز نشانگر را جابه‌جا کنید");
  };

  /** تبدیل مختصات فعلی به آدرس */
  const reverseLookup = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`, { cache: "no-store" });
      const d = await res.json();
      if (d.results?.[0]?.label) setAddress(d.results[0].label);
    } catch {
      /* ignore */
    }
  }, []);

  /* ------------------------- موقعیت‌یاب GPS ------------------------- */

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
    if (!window.isSecureContext) setStatus("⚠️ GPS فقط روی آدرس https فعال می‌شود");
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
          void reverseLookup(pos.coords.latitude, pos.coords.longitude);
        }
      },
      (err) => {
        stop();
        setStatus(
          err.code === 1
            ? "⛔ دسترسی به موقعیت رد شد. از تنظیمات مرورگر اجازه دهید یا آدرس را جستجو کنید."
            : "دریافت موقعیت ناموفق بود — می‌توانید آدرس را جستجو کنید.",
        );
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );
    timerRef.current = setTimeout(() => {
      stop();
      if (bestRef.current === Number.POSITIVE_INFINITY) {
        setStatus("موقعیتی دریافت نشد؛ آدرس را جستجو کنید یا روی نقشه بزنید");
      } else {
        setStatus(`✅ بهترین دقت: ${Math.round(bestRef.current)} متر`);
        if (value.lat && value.lng) void reverseLookup(value.lat, value.lng);
      }
    }, 15000);
  };

  const acc = value.accuracy ?? null;
  const accTone = acc === null ? "amber" : acc <= 20 ? "green" : acc <= 60 ? "amber" : "slate";

  return (
    <div className="space-y-2">
      {/* ---------------- جستجوی آدرس ---------------- */}
      <div className="relative" ref={boxRef}>
        <div className="flex gap-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => hits.length && setOpenList(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void runSearch(query);
              }
            }}
            placeholder="🔍 جستجوی آدرس یا نام محل... (مثلاً: میدان ونک تهران)"
          />
          <Button variant="soft" onClick={() => void runSearch(query)} disabled={searching}>
            {searching ? "..." : "🔍 جستجو"}
          </Button>
          {suggestQuery.trim() ? (
            <Button
              variant="ghost"
              onClick={() => {
                setQuery(suggestQuery);
                void runSearch(suggestQuery);
              }}
              title="جستجو با نام همین رکورد"
            >
              📍
            </Button>
          ) : null}
        </div>

        {searchMsg ? <p className="mt-1 text-[11px] text-slate-500">{searchMsg}</p> : null}

        {openList && hits.length > 0 ? (
          <div className="fade-in absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl bg-white py-1 shadow-xl ring-1 ring-slate-200">
            {hits.map((h, i) => (
              <button
                key={`${h.lat}-${h.lng}-${i}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickHit(h)}
                className="block w-full px-3 py-2 text-right text-xs leading-5 text-slate-700 hover:bg-teal-50"
              >
                📍 {h.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* ---------------- GPS و وضعیت ---------------- */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="soft" onClick={locate} disabled={busy}>
          {busy ? "⏳ در حال اندازه‌گیری..." : "📡 موقعیت فعلی من"}
        </Button>
        {busy ? (
          <Button
            variant="ghost"
            onClick={() => {
              stop();
              setStatus("اندازه‌گیری متوقف شد");
            }}
          >
            توقف
          </Button>
        ) : null}
        {value.lat && value.lng ? (
          <>
            <Badge tone={accTone as "green" | "amber" | "slate"}>
              {acc ? `دقت ≈ ${toPersianDigits(Math.round(acc))} متر` : "ثبت شده"}
            </Badge>
            <Button variant="ghost" onClick={() => void reverseLookup(value.lat!, value.lng!)}>
              🏷 دریافت آدرس این نقطه
            </Button>
          </>
        ) : (
          <Badge tone="amber">لوکیشن ثبت نشده</Badge>
        )}
      </div>

      {status ? <p className="text-[11px] text-slate-500">{status}</p> : null}
      {address ? (
        <p className="rounded-lg bg-slate-50 px-2 py-1.5 text-[11px] text-slate-600 ring-1 ring-slate-200">
          🏷 {address}
        </p>
      ) : null}
      <p className="text-[11px] text-slate-400">
        نشانگر روی نقشه قابل کشیدن است؛ برای دقت بیشتر آن را روی درب ورودی قرار دهید.
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
