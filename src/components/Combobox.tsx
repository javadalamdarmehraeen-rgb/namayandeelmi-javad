"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/** Typable + searchable dropdown. Options refresh live from the server. */
export default function Combobox({
  value,
  onChange,
  options,
  placeholder = "انتخاب یا تایپ کنید...",
  allowCustom = true,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  allowCustom?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(value);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 60);
    const words = q.split(/\s+/);
    return options
      .filter((o) => {
        const t = o.toLowerCase();
        return words.every((w) => t.includes(w));
      })
      .slice(0, 60);
  }, [query, options]);

  return (
    <div className="relative" ref={ref}>
      <input
        value={query}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (allowCustom) onChange(e.target.value);
        }}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
      />
      <span className="pointer-events-none absolute left-3 top-3 text-slate-400">▾</span>
      {open ? (
        <div className="fade-in absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl bg-white py-1 shadow-xl ring-1 ring-slate-200">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400">
              موردی یافت نشد{allowCustom ? " – مقدار تایپ‌شده ثبت می‌شود" : ""}
            </div>
          ) : (
            filtered.map((o) => (
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
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
