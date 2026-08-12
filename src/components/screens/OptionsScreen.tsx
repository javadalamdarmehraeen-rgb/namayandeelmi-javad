"use client";
import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Input, SectionTitle } from "@/components/ui";
import { OPTION_CATEGORIES } from "@/lib/constants";
import { useConfirm } from "@/components/Confirm";
import { toPersianDigits } from "@/lib/jalali";
import { useLive } from "@/lib/useLive";
type Opt = { id: number; category: string; value: string; parent: string; createdBy: string };
/**  «» —      (   ) */
export default function OptionsScreen({ canDelete = false }: { canDelete?: boolean }) {
  const [rows, setRows] = useState<Opt[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<{ id: number; value: string } | null>(null);
  const [parentSel, setParentSel] = useState<Record<string, string>>({});
  const confirm = useConfirm();
  const load = useCallback(async () => {

    const res = await fetch("/api/options", { cache: "no-store" });
    if (res.ok) setRows((await res.json()).rows ?? []);
  }, []);
  useLive(load, 20000);
  const add = async (category: string) => {
    const value = (draft[category] ?? "").trim();
    if (!value) return;
    if ((category === "city" || category === "region") && !(parentSel[category] ?? "")) {
      setMsg({ kind: "error", text: category === "city" ? "    " : "    " });
      return;
    }
    const label = OPTION_CATEGORIES.find((c) => c.key === category)?.label ?? category;
    if (!(await confirm({ title: "  ", message: `«${value}»   «${label}»  `, confirmText: 
"" })))
      return;
    const res = await fetch("/api/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, value, parent: parentSel[category] ?? "" }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setDraft({ ...draft, [category]: "" });
      setMsg({
        kind: "success",
        text: d.duplicate ? "     " : "          ",
      });
      load();
    } else setMsg({ kind: "error", text: d.error ?? "  " });
  };
  const remove = async (id: number, value: string) => {
    if (
      !(await confirm({
        title: " ",
        message: `«${value}»       .`,
        confirmText: "",
        danger: true,
      }))
    )
      return;
    const res = await fetch(`/api/options?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMsg({ kind: "success", text: "  " });
      load();
    } else setMsg({ kind: "error", text: "  " });
  };
  const saveEdit = async () => {
    if (!editing) return;
    const value = editing.value.trim();
    if (!value) return;
    if (!(await confirm({ title: " ", message: `  «${value}»  `, confirmText: "" })))
      return;
    const res = await fetch("/api/options", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing.id, value }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg({ kind: "success", text: "   " });
      setEditing(null);
      load();
    } else setMsg({ kind: "error", text: d.error ?? " " });
  };
  return (
    <div className="space-y-4">
      <SectionTitle icon="">   ( )</SectionTitle>
      {msg ? <Alert kind={msg.kind}>{msg.text}</Alert> : null}
      <Input placeholder="   ..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" /
>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {OPTION_CATEGORIES.map((cat) => {
          const par = parentSel[cat.key] ?? "";
          const items = rows.filter(
            (r) =>
              r.category === cat.key &&
              (!q || r.value.toLowerCase().includes(q.toLowerCase())) &&
              (!par || r.parent === par),
          );

          return (
            <Card key={cat.key}>
              <h3 className="mb-2 text-sm font-bold text-slate-800">
                {cat.label} <span className="text-xs text-slate-400">({toPersianDigits(items.length)})</span>
              </h3>
              {cat.key === "city" || cat.key === "region" ? (
                <select
                  value={parentSel[cat.key] ?? ""}
                  onChange={(e) => setParentSel({ ...parentSel, [cat.key]: e.target.value })}
                  className="mb-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                >
                  <option value="">
                    {cat.key === "city" ? "—      —" : "—      —"}
                  </option>
                  {[...new Set(rows.filter((r) => r.category === (cat.key === "city" ? "province" : "city")).map((r) => 
r.value))]
                    .sort()
                    .map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                </select>
              ) : null}
              <div className="mb-3 flex gap-2">
                <Input
                  value={draft[cat.key] ?? ""}
                  onChange={(e) => setDraft({ ...draft, [cat.key]: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") add(cat.key);
                  }}
                  placeholder=" ..."
                />
                <Button onClick={() => add(cat.key)}></Button>
              </div>
              <ul className="max-h-60 space-y-1 overflow-y-auto">
                {items.map((it) =>
                  editing?.id === it.id ? (
                    <li key={it.id} className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1.5">
                      <Input
                        value={editing.value}
                        onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                        className="px-2 py-1 text-xs"
                        autoFocus
                      />
                      <button onClick={saveEdit} className="rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-bold te
xt-white">
                        
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="rounded-lg bg-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700"
                      >
                        
                      </button>
                    </li>
                  ) : (
                    <li key={it.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-1.
5 text-sm">
                      <span className="min-w-0 truncate">
                        {it.value}
                        {it.parent ? <span className="mr-1 text-[10px] text-teal-600">({it.parent})</span> : null}
                        {it.createdBy ? <span className="mr-2 text-[10px] text-slate-400">({it.createdBy})</span> : null
}
                      </span>
                      <span className="flex shrink-0 gap-1">
                        {canDelete ? (
                          <>
                            <button
                              onClick={() => setEditing({ id: it.id, value: it.value })}
                              className="rounded-lg bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-700"
                            >
                               
                            </button>
                            <button
                              onClick={() => remove(it.id, it.value)}
                              className="rounded-lg bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700"
                            >
                              
                            </button>
                          </>
                        ) : null}
                      </span>
                    </li>
                  ),

                )}
                {items.length === 0 ? <li className="text-xs text-slate-400"> </li> : null}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
