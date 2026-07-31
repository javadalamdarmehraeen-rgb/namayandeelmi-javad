"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Input, SectionTitle } from "@/components/ui";
import { OPTION_CATEGORIES } from "@/lib/constants";
import { toPersianDigits } from "@/lib/jalali";

type Opt = { id: number; category: string; value: string };

export default function OptionsPage() {
  const [rows, setRows] = useState<Opt[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

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
    if (res.ok) {
      setDraft({ ...draft, [category]: "" });
      setMsg("✅ مقدار جدید افزوده شد و بلافاصله در فرم نمایندگان قابل انتخاب است");
      load();
    }
  };

  const remove = async (id: number) => {
    const res = await fetch(`/api/options?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMsg("🗑 مقدار حذف شد");
      load();
    }
  };

  return (
    <div className="space-y-4">
      <SectionTitle icon="🧩">مدیریت لیست‌های کشویی (بروزرسانی لحظه‌ای)</SectionTitle>
      {msg ? <Alert kind="success">{msg}</Alert> : null}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {OPTION_CATEGORIES.map((cat) => {
          const items = rows.filter((r) => r.category === cat.key);
          return (
            <Card key={cat.key}>
              <h3 className="mb-2 font-bold text-slate-800">
                {cat.label} <span className="text-xs text-slate-400">({toPersianDigits(items.length)})</span>
              </h3>
              <div className="mb-3 flex gap-2">
                <Input
                  value={draft[cat.key] ?? ""}
                  onChange={(e) => setDraft({ ...draft, [cat.key]: e.target.value })}
                  placeholder="مقدار جدید..."
                />
                <Button onClick={() => add(cat.key)}>افزودن</Button>
              </div>
              <ul className="max-h-72 space-y-1 overflow-y-auto">
                {items.map((it) => (
                  <li
                    key={it.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm"
                  >
                    <span>{it.value}</span>
                    <button onClick={() => remove(it.id)} className="text-xs font-bold text-rose-600">
                      حذف
                    </button>
                  </li>
                ))}
                {items.length === 0 ? <li className="text-xs text-slate-400">موردی ثبت نشده است</li> : null}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
