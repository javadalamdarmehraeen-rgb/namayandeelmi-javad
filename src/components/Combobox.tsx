"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * کشویی قابل تایپ با جستجوی پیشرفته + دکمه «افزودن در لحظه».
 * مقدار جدید بلافاصله در دیتابیس ذخیره و برای همه نمایندگان قابل انتخاب می‌شود.
 */
export default function Combobox({
  value,
  onChange,
  options,
  category,
  onAdded,
  canAdd = true,
  placeholder = "انتخاب یا تایپ کنید...",
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  category?: string;
  onAdded?: (v: string) => void;
  canAdd?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 50);
    const words = q.split(/\s+/);
    return options.filter((o) => words.every((w) => o.toLowerCase().includes(w))).slice(0, 50);
  }, [query, options]);

  const exact = options.some((o) => o.trim() === query.trim());
  const showAdd = canAdd && !!category && query.trim().length > 0 && !exact;

  const addNow = async () => {
    const v = query.trim();
    if (!v || !category) return;
    setSaving(true);
    const res = await fetch("/api/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, value: v }),
    }).catch(() => null);
    setSaving(false);
    if (res?.ok) {
      onChange(v);
      onAdded?.(v);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <div className="flex gap-1">
        <input
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            onChange(e.target.value);
          }}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
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

      {open ? (
        <div className="fade-in absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-xl bg-white py-1 shadow-xl ring-1 ring-slate-200">
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
              onClick={() => {
                onChange(o);
                setQuery(o);
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-right text-sm hover:bg-teal-50 ${
                o === value ? "bg-teal-50 font-bold text-teal-700" : "text-slate-700"
              }`}
            >
              {o}
            </button>
          ))}
          {filtered.length === 0 && !showAdd ? (
            <div className="px-3 py-2 text-xs text-slate-400">موردی یافت نشد</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
