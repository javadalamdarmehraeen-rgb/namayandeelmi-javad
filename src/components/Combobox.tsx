"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useConfirm } from "./Confirm";
export type Opt = { value: string; parent?: string };
/**
 *        « ».
 *
 *  :
 *  -            .
 *  -        «»     .
 *  -              .
 *  -    (  )       .
 */

export default function Combobox({
  value,
  onChange,
  options,
  category,
  onAdded,
  canAdd = true,
  placeholder = "   ...",
  parent = "",
  parentLabel = "",
  requireParent = false,
  disabled = false,
  selectOnly = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  category?: string;
  onAdded?: (v: string) => void;
  canAdd?: boolean;
  placeholder?: string;
  /**   (     ) */
  parent?: string;
  parentLabel?: string;
  requireParent?: boolean;
  disabled?: boolean;
  /**     —         */
  selectOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [saving, setSaving] = useState(false);
  const [typing, setTyping] = useState(false);
  const [note, setNote] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirm = useConfirm();
  const blocked = disabled || (requireParent && !parent.trim());
  useEffect(() => setQuery(value), [value]);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
  useEffect(
    () => () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    },
    [],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 80);
    const words = q.split(/\s+/);
    return options.filter((o) => words.every((w) => o.toLowerCase().includes(w))).slice(0, 80);
  }, [query, options]);
  const trimmed = query.trim();
  const exact = options.some((o) => o.trim() === trimmed);
  //                
  const showAdd = !selectOnly && canAdd && !!category && !blocked && trimmed.length >= 2 && !exact && !typing;
  const markTyping = () => {
    setTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(false), 700);
  };
  const addNow = async () => {
    if (!trimmed || !category || saving) return;
    const ok = await confirm({
      title: "  ",
      message: `«${trimmed}»${parent ? `  «${parent}»` : ""}    \n      
  .`,
      confirmText: "  ",
    });
    if (!ok) return;

    setSaving(true);
    const res = await fetch("/api/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, value: trimmed, parent }),
    }).catch(() => null);
    setSaving(false);
    const data = await res?.json().catch(() => ({}));
    if (res?.ok) {
      onChange(trimmed);
      onAdded?.(trimmed);
      setOpen(false);
      setNote(data?.duplicate ? "     " : "    ");
      setTimeout(() => setNote(""), 2500);
    } else {
      setNote(data?.error ?? "  ");
      setTimeout(() => setNote(""), 3500);
    }
  };
  return (
    <div className="relative" ref={ref}>
      <div className="flex gap-1">
        <input
          value={query}
          placeholder={blocked ? ` ${parentLabel || " "}   ` : placeholder}
          disabled={blocked}
          onFocus={() => !blocked && setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            markTyping();
            //   « »          
            if (!selectOnly) onChange(e.target.value);
          }}
          onBlur={() => {
            //              
            if (selectOnly) setTimeout(() => setQuery(value), 150);
          }}
          onKeyDown={(e) => {
            // Enter         
            if (e.key === "Enter") e.preventDefault();
            if (e.key === "Escape") setOpen(false);
          }}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focu
s:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate
-400"
        />
        {showAdd ? (
          <button
            type="button"
            onClick={addNow}
            disabled={saving}
            title={` «${trimmed}»  `}
            className="shrink-0 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 disable
d:opacity-50"
          >
            {saving ? "..." : " "}
          </button>
        ) : null}
      </div>
      {note ? <p className="mt-1 text-[10px] font-bold text-emerald-700">{note}</p> : null}
      {selectOnly && !blocked && options.length > 0 ? (
        <p className="mt-1 text-[10px] text-slate-400">{options.length.toLocaleString("fa-IR")}   </p>
      ) : null}
      {open && !blocked ? (
        <div className="fade-in absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl bg-white py-1 shadow-xl ri
ng-1 ring-slate-200">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-slate-400">
              {selectOnly
                ? "   —    "
                : trimmed.length >= 2
                  ? "   —   « »   "
                  : "   "}
            </div>
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
        </div>
      ) : null}
    </div>
  );
}
