"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Input, SectionTitle } from "@/components/ui";
import { OPTION_CATEGORIES } from "@/lib/constants";
import { toPersianDigits } from "@/lib/jalali";

type Opt = { id: number; category: string; value: string; createdBy: string };

/** صفحه «افزودن‌ها» — مشترک بین نماینده و مدیر (حذف فقط برای مدیر) */
export default function OptionsScreen({ canDelete = false }: { canDelete?: boolean }) {
  const [rows, setRows] = useState<Opt[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/options", { cache: "no-store" });
    if (res.ok) setRows((await res.json()).rows ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (category: string) => {
    const value = (draft[category] ?? "").trim();
    if (!value) return;
    const res = await fetch("/api/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, value }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setDraft({ ...draft, [category]: "" });
      setMsg({
        kind: "success",
        text: d.duplicate ? "این مقدار از قبل وجود دارد" : "✅ افزوده شد و بلافاصله در همه فرم‌ها قابل انتخاب است",
      });
      load();
    } else setMsg({ kind: "error", text: d.error ?? "خطا در افزودن" });
  };

  const remove = async (id: number) => {
    const res = await fetch(`/api/options?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMsg({ kind: "success", text: "🗑 حذف شد" });
      load();
    }
  };

  return (
    <div className="space-y-4">
      <SectionTitle icon="➕">افزودن مقادیر کشویی (بروزرسانی لحظه‌ای)</SectionTitle>
      {msg ? <Alert kind={msg.kind}>{msg.text}</Alert> : null}
      <Input placeholder="🔍 جستجو در مقادیر..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {OPTION_CATEGORIES.map((cat) => {
          const items = rows.filter(
            (r) => r.category === cat.key && (!q || r.value.toLowerCase().includes(q.toLowerCase())),
          );
          return (
            <Card key={cat.key}>
              <h3 className="mb-2 text-sm font-bold text-slate-800">
                {cat.label} <span className="text-xs text-slate-400">({toPersianDigits(items.length)})</span>
              </h3>
              <div className="mb-3 flex gap-2">
                <Input
                  value={draft[cat.key] ?? ""}
                  onChange={(e) => setDraft({ ...draft, [cat.key]: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") add(cat.key);
                  }}
                  placeholder="مقدار جدید..."
                />
                <Button onClick={() => add(cat.key)}>افزودن</Button>
              </div>
              <ul className="max-h-60 space-y-1 overflow-y-auto">
                {items.map((it) => (
                  <li key={it.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
                    <span>
                      {it.value}
                      {it.createdBy ? <span className="mr-2 text-[10px] text-slate-400">({it.createdBy})</span> : null}
                    </span>
                    {canDelete ? (
                      <button onClick={() => remove(it.id)} className="text-xs font-bold text-rose-600">
                        حذف
                      </button>
                    ) : null}
                  </li>
                ))}
                {items.length === 0 ? <li className="text-xs text-slate-400">موردی نیست</li> : null}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
