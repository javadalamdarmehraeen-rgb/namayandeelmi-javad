"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  JALALI_MONTHS,
  WEEK_DAYS,
  formatJalali,
  jalaliMonthLength,
  jalaliWeekDay,
  maskJalaliInput,
  parseJalali,
  toPersianDigits,
  todayJalali,
} from "@/lib/jalali";
export default function JalaliDateInput({
  value,
  onChange,
  placeholder = "//",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {

  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const parsed = parseJalali(value) ?? parseJalali(todayJalali())!;
  const [view, setView] = useState<[number, number]>([parsed[0], parsed[1]]);
  useEffect(() => {
    const p = parseJalali(value);
    if (p) setView([p[0], p[1]]);
  }, [value]);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
  const grid = useMemo(() => {
    const [jy, jm] = view;
    const len = jalaliMonthLength(jy, jm);
    const first = jalaliWeekDay(jy, jm, 1);
    const cells: (number | null)[] = Array(first).fill(null);
    for (let d = 1; d <= len; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [view]);
  const selected = parseJalali(value);
  return (
    <div className="relative" ref={boxRef}>
      <div className="flex gap-2">
        <input
          value={value}
          inputMode="numeric"
          placeholder={placeholder}
          onChange={(e) => onChange(maskJalaliInput(e.target.value))}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm tracking-widest outline-none
 transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 rounded-xl bg-teal-50 px-3 text-lg ring-1 ring-teal-200 hover:bg-teal-100"
          title="  "
        >
          
        </button>
      </div>
      {open ? (
        <div className="fade-in absolute z-30 mt-2 w-[19rem] max-w-[92vw] rounded-2xl bg-white p-3 shadow-xl ring-1 ring
-slate-200">
          <div className="mb-2 flex items-center justify-between gap-1">
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100"
              onClick={() => setView(([y, m]) => (m === 1 ? [y - 1, 12] : [y, m - 1]))}
            >
              ‹
            </button>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <select
                value={view[1]}
                onChange={(e) => setView(([y]) => [y, Number(e.target.value)])}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
              >
                {JALALI_MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={view[0]}
                onChange={(e) => setView(([, m]) => [Number(e.target.value) || 1400, m])}
                className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-xs"
              />
            </div>
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100"

              onClick={() => setView(([y, m]) => (m === 12 ? [y + 1, 1] : [y, m + 1]))}
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
            {WEEK_DAYS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {grid.map((d, i) => {
              const isSel =
                d !== null && selected && selected[0] === view[0] && selected[1] === view[1] && selected[2] === d;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={d === null}
                  onClick={() => {
                    if (d === null) return;
                    onChange(formatJalali(view[0], view[1], d));
                    setOpen(false);
                  }}
                  className={`h-8 rounded-lg text-xs font-semibold transition ${
                    d === null
                      ? "cursor-default"
                      : isSel
                        ? "bg-teal-600 text-white"
                        : "text-slate-700 hover:bg-teal-50"
                  }`}
                >
                  {d === null ? "" : toPersianDigits(d)}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(todayJalali());
              setOpen(false);
            }}
            className="mt-2 w-full rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
          >
            : {toPersianDigits(todayJalali())}
          </button>
        </div>
      ) : null}
    </div>
  );
}
