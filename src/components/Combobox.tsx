"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * کشویی قابل تایپ با جستجوی پیشرفته + افزودن لحظه‌ای.
 *
 * نکته مهم: وقتی مقداری از قبل انتخاب شده باشد، تا زمانی که کاربر چیزی تایپ نکند
 * کل فهرست نمایش داده می‌شود (نه فقط موردِ انتخاب‌شده) تا امکان تعویض انتخاب باشد.
 */
export default function Combobox({
  value,
  onChange,
  options,
  category,
  onAdded,
  canAdd = true,
  disabled = false,
  parent,
  placeholder = "انتخاب یا تایپ کنید...",
  emptyHint,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  category?: string;
  onAdded?: (v: string) => void;
  canAdd?: boolean;
  disabled?: boolean;
  /** مقدار والد برای دسته‌های وابسته (شهر ← استان، منطقه ← شهر) */
  parent?: string;
  placeholder?: string;
  emptyHint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  /** آیا کاربر در حال تایپ است؟ تا وقتی تایپ نکرده، همه گزینه‌ها نمایش داده می‌شوند */
  const [typing, setTyping] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
    setTyping(false);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setTyping(false);
        setQuery(value);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    // بدون تایپ (یا وقتی متن دقیقاً همان مقدار انتخاب‌شده است) → کل فهرست
    if (!typing || !q) return options.slice(0, 200);
    const words = q.split(/\s+/);
    return options.filter((o) => words.every((w) => o.toLowerCase().includes(w))).slice(0, 200);
  }, [query, options, typing]);

  const exact = options.some((o) => o.trim() === query.trim());
  const showAdd = canAdd && !!category && !disabled && typing && query.trim().length > 0 && !exact;

  const addNow = async () => {
    const v = query.trim();
    if (!v || !category) return;
    setSaving(true);
    const res = await fetch("/api/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, value: v, parent: parent ?? "" }),
    }).catch(() => null);
    setSaving(false);
    if (res?.ok) {
      onChange(v);
      onAdded?.(v);
      setOpen(false);
      setTyping(false);
    }
  };

  const pick = (o: string) => {
    onChange(o);
    setQuery(o);
    setTyping(false);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="flex gap-1">
        <div className="relative flex-1">
          <input
            value={query}
            placeholder={placeholder}
            disabled={disabled}
            onFocus={() => {
              if (!disabled) {
                setOpen(true);
                setTyping(false);
              }
            }}
            onClick={() => {
              if (!disabled) setOpen(true);
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              setTyping(true);
              setOpen(true);
              onChange(e.target.value);
            }}
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-3 pl-8 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100 disabled:text-slate-400"
          />
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              setTyping(false);
              setOpen((v) => !v);
            }}
            className="absolute left-1 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-100"
            title="نمایش فهرست"
          >
            ▾
          </button>
        </div>
        {showAdd ? (
          <button
            type="button"
            onClick={addNow}
            disabled={saving}
            title="افزودن به لیست"
            className="shrink-0 rounded-xl bg-emerald-600 px-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "..." : "➕"}
          </button>
        ) : null}
      </div>

      {open && !disabled ? (
        <div className="fade-in absolute z-40 mt-1 max-h-56 w-full overflow-y-auto rounded-xl bg-white py-1 shadow-xl ring-1 ring-slate-200">
          {showAdd ? (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={addNow}
              className="block w-full bg-emerald-50 px-3 py-2 text-right text-xs font-bold text-emerald-800"
            >
              ➕ افزودن «{query.trim()}» به لیست
            </button>
          ) : null}
          {filtered.map((o) => (
            <button
              key={o}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(o)}
              className={`block w-full px-3 py-2 text-right text-sm hover:bg-teal-50 ${
                o === value ? "bg-teal-50 font-bold text-teal-700" : "text-slate-700"
              }`}
            >
              {o === value ? "✓ " : ""}
              {o}
            </button>
          ))}
          {filtered.length === 0 && !showAdd ? (
            <div className="px-3 py-3 text-center text-xs text-slate-400">
              {emptyHint ?? "موردی یافت نشد"}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
