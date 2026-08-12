"use client";
import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Input, SectionTitle } from "@/components/ui";
import {
  AVAILABLE_COLUMNS,
  AVAILABLE_FORM_FIELDS,
  DEFAULT_COLUMNS,
  DEFAULT_FORM_FIELDS,
  DEFAULT_PRODUCTS,
  type ColumnConfig,
  type FormFieldConfig,
  type ProductConfig,
} from "@/lib/defaults";
import { useConfirm } from "@/components/Confirm";
import { toPersianDigits } from "@/lib/jalali";
const TABLES = [
  { key: "pharmacies", label: " " },
  { key: "doctors", label: " " },
  { key: "orders", label: " " },
];
export default function ColumnsPage() {
  const [cols, setCols] = useState<Record<string, ColumnConfig[]>>(DEFAULT_COLUMNS);
  const [formFields, setFormFields] = useState<Record<string, FormFieldConfig[]>>(DEFAULT_FORM_FIELDS);
  const [products, setProducts] = useState<ProductConfig[]>(DEFAULT_PRODUCTS);
  const [tab, setTab] = useState("pharmacies");
  const [msg, setMsg] = useState("");
  const [newProduct, setNewProduct] = useState("");
  const [addCol, setAddCol] = useState("");
  const [addField, setAddField] = useState("");
  const confirm = useConfirm();
  const load = useCallback(async () => {
    const res = await fetch("/api/settings", { cache: "no-store" });
    if (!res.ok) return;
    const d = await res.json();
    const v = d.values ?? {};
    setProducts((v.products as ProductConfig[]) ?? DEFAULT_PRODUCTS);
    /**         */
    const merge = (key: string, def: ColumnConfig[]) => {
      const stored = v[key] as ColumnConfig[] | undefined;
      if (!Array.isArray(stored) || stored.length === 0) return def;
      const have = new Set(stored.map((c) => c.key));
      const mandatory = def.filter((c) => c.key === "actions" && !have.has(c.key));
      return [...stored, ...mandatory];
    };
    setCols({
      pharmacies: merge("columns.pharmacies", DEFAULT_COLUMNS.pharmacies),
      doctors: merge("columns.doctors", DEFAULT_COLUMNS.doctors),
      orders: merge("columns.orders", DEFAULT_COLUMNS.orders),
    });
    const mergeFields = (key: string, def: FormFieldConfig[]) => {
      const stored = v[key] as FormFieldConfig[] | undefined;
      if (!Array.isArray(stored) || stored.length === 0) return def;
      const have = new Set(stored.map((f) => f.key));
      const mandatory = def.filter((f) => f.key === "location" && !have.has(f.key));
      return [...stored, ...mandatory];
    };
    setFormFields({
      pharmacies: mergeFields("fields.pharmacies", DEFAULT_FORM_FIELDS.pharmacies),
      doctors: mergeFields("fields.doctors", DEFAULT_FORM_FIELDS.doctors),
      orders: mergeFields("fields.orders", DEFAULT_FORM_FIELDS.orders),
    });

  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const persist = async (key: string, value: unknown, success = "      ") => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    setMsg(res.ok ? success : "    ");
    return res.ok;
  };
  const save = async (key: string, value: unknown) => {
    if (!(await confirm({ title: " ", message: "        ", confirmTe
xt: "" })))
      return;
    await persist(key, value);
  };
  const move = (list: ColumnConfig[], i: number, dir: -1 | 1) => {
    const next = [...list];
    const j = i + dir;
    if (j < 0 || j >= next.length) return next;
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  };
  const moveP = (i: number, dir: -1 | 1) => {
    const next = [...products];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setProducts(next);
  };
  const current = cols[tab] ?? [];
  const currentFields = formFields[tab] ?? [];
  return (
    <div className="space-y-4">
      <SectionTitle icon="">   </SectionTitle>
      {msg ? <Alert kind="success">{msg}</Alert> : null}
      <Card>
        <div className="mb-3 flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 text-xs font-bold">
          {TABLES.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-3 py-2 ${tab === t.key ? "bg-teal-600 text-white" : "text-slate-600"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="mb-2 text-[11px] text-slate-500">
                       .      .
        </p>
        <ul className="space-y-1">
          {current.map((c, i) => (
            <li key={c.key} className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <span className="w-6 text-center text-[11px] text-slate-400">{toPersianDigits(i + 1)}</span>
              <input
                type="checkbox"
                className="size-4 accent-teal-600"
                checked={c.visible}
                onChange={(e) => {
                  const next = [...current];
                  next[i] = { ...c, visible: e.target.checked };
                  setCols({ ...cols, [tab]: next });
                }}
              />
              <Input
                value={c.label}
                onChange={(e) => {
                  const next = [...current];
                  next[i] = { ...c, label: e.target.value };
                  setCols({ ...cols, [tab]: next });
                }}

                className="max-w-[180px] px-2 py-1 text-xs"
              />
              <span className="text-[10px] text-slate-400">{c.key}</span>
              <div className="mr-auto flex gap-1">
                <button
                  onClick={() => setCols({ ...cols, [tab]: move(current, i, -1) })}
                  className="rounded-lg bg-white px-2 py-1 text-xs ring-1 ring-slate-200"
                >
                  ↑
                </button>
                <button
                  onClick={() => setCols({ ...cols, [tab]: move(current, i, 1) })}
                  className="rounded-lg bg-white px-2 py-1 text-xs ring-1 ring-slate-200"
                >
                  ↓
                </button>
                <button
                  onClick={async () => {
                    if (
                      !(await confirm({
                        title: " ",
                        message: ` «${c.label}»          .`,
                        confirmText: "",
                        danger: true,
                      }))
                    )
                      return;
                    setCols({ ...cols, [tab]: current.filter((_, x) => x !== i) });
                  }}
                  className="rounded-lg bg-rose-100 px-2 py-1 text-xs font-bold text-rose-700"
                >
                  
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200">
          <span className="text-[11px] font-bold text-slate-600"> :</span>
          <select
            value={addCol}
            onChange={(e) => setAddCol(e.target.value)}
            className="rounded-xl border border-slate-300 px-2 py-2 text-xs"
          >
            <option value=""> ...</option>
            {(AVAILABLE_COLUMNS[tab] ?? [])
              .filter((a) => !current.some((c) => c.key === a.key))
              .map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label}
                </option>
              ))}
          </select>
          <Button
            variant="soft"
            onClick={async () => {
              const found = (AVAILABLE_COLUMNS[tab] ?? []).find((a) => a.key === addCol);
              if (!found) {
                setMsg("     ");
                return;
              }
              const next = [...current, { ...found, visible: true }];
              setCols({ ...cols, [tab]: next });
              setAddCol("");
              await persist(`columns.${tab}`, next, `  «${found.label}»    `);
            }}
          >
             
          </Button>
          <span className="text-[10px] text-slate-400">
            {toPersianDigits((AVAILABLE_COLUMNS[tab] ?? []).filter((a) => !current.some((c) => c.key === a.key)).length)
}{" "}
              
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={() => save(`columns.${tab}`, current)}>   </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              if (!(await confirm({ title: " ", message: "      ", confi
rmText: "" })))
                return;

              setCols({ ...cols, [tab]: DEFAULT_COLUMNS[tab] });
            }}
          >
             
          </Button>
        </div>
      </Card>
      {/*     —     */}
      <Card>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-800">   </h3>
            <p className="mt-1 text-[11px] text-slate-500">
                      « »   .        
 .
            </p>
          </div>
          <Badge tone="green">{toPersianDigits(currentFields.filter((f) => f.visible).length)}  </Badge>
        </div>
        <ul className="space-y-1">
          {currentFields.map((f, i) => (
            <li key={f.key} className="flex flex-wrap items-center gap-2 rounded-xl bg-indigo-50/60 px-3 py-2 ring-1 rin
g-indigo-100">
              <span className="w-6 text-center text-[11px] text-slate-400">{toPersianDigits(i + 1)}</span>
              <input
                type="checkbox"
                className="size-4 accent-indigo-600"
                checked={f.visible}
                onChange={(e) => {
                  const next = [...currentFields];
                  next[i] = { ...f, visible: e.target.checked };
                  setFormFields({ ...formFields, [tab]: next });
                }}
              />
              <Input
                value={f.label}
                onChange={(e) => {
                  const next = [...currentFields];
                  next[i] = { ...f, label: e.target.value };
                  setFormFields({ ...formFields, [tab]: next });
                }}
                className="max-w-[220px] px-2 py-1 text-xs"
              />
              <span className="rounded bg-white px-2 py-0.5 text-[10px] text-slate-400">{f.key}</span>
              <div className="mr-auto flex gap-1">
                <button
                  onClick={() => setFormFields({ ...formFields, [tab]: move(currentFields, i, -1) })}
                  className="rounded-lg bg-white px-2 py-1 text-xs ring-1 ring-slate-200"
                >
                  ↑
                </button>
                <button
                  onClick={() => setFormFields({ ...formFields, [tab]: move(currentFields, i, 1) })}
                  className="rounded-lg bg-white px-2 py-1 text-xs ring-1 ring-slate-200"
                >
                  ↓
                </button>
                <button
                  onClick={async () => {
                    if (!(await confirm({
                      title: "  ",
                      message: ` «${f.label}»          .`,
                      confirmText: "",
                      danger: true,
                    }))) return;
                    const next = currentFields.filter((_, x) => x !== i);
                    setFormFields({ ...formFields, [tab]: next });
                    await persist(`fields.${tab}`, next, `  «${f.label}»  `);
                  }}
                  className="rounded-lg bg-rose-100 px-2 py-1 text-xs font-bold text-rose-700"
                >
                  
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-indigo-50 p-2 ring-1 ring-indigo-200">
          <span className="text-[11px] font-bold text-indigo-800">   :</span>
          <select
            value={addField}
            onChange={(e) => setAddField(e.target.value)}

            className="rounded-xl border border-indigo-200 bg-white px-2 py-2 text-xs"
          >
            <option value=""> ...</option>
            {(AVAILABLE_FORM_FIELDS[tab] ?? [])
              .filter((a) => !currentFields.some((f) => f.key === a.key))
              .map((a) => (
                <option key={a.key} value={a.key}>{a.label}</option>
              ))}
          </select>
          <Button
            variant="soft"
            onClick={async () => {
              const found = (AVAILABLE_FORM_FIELDS[tab] ?? []).find((a) => a.key === addField);
              if (!found) {
                setMsg("      ");
                return;
              }
              const next = [...currentFields, { ...found, visible: true }];
              setFormFields({ ...formFields, [tab]: next });
              setAddField("");
              await persist(`fields.${tab}`, next, `  «${found.label}»     `);
            }}
          >
               
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => save(`fields.${tab}`, currentFields)}>    </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              if (!(await confirm({ title: " ", message: "      ", confirmTe
xt: "" }))) return;
              const next = DEFAULT_FORM_FIELDS[tab];
              setFormFields({ ...formFields, [tab]: next });
              await persist(`fields.${tab}`, next, "      ");
            }}
          >
              
          </Button>
        </div>
      </Card>
      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">   (  /)</h3>
        <ul className="space-y-1">
          {products.map((p, i) => (
            <li key={p.key} className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <span className="w-6 text-center text-[11px] text-slate-400">{toPersianDigits(i + 1)}</span>
              <input
                type="checkbox"
                className="size-4 accent-teal-600"
                checked={p.enabled}
                onChange={(e) => {
                  const next = [...products];
                  next[i] = { ...p, enabled: e.target.checked };
                  setProducts(next);
                }}
              />
              <Input
                value={p.label}
                onChange={(e) => {
                  const next = [...products];
                  next[i] = { ...p, label: e.target.value };
                  setProducts(next);
                }}
                className="max-w-[150px] px-2 py-1 text-xs"
              />
              <Input
                value={p.bonusLabel}
                onChange={(e) => {
                  const next = [...products];
                  next[i] = { ...p, bonusLabel: e.target.value };
                  setProducts(next);
                }}
                className="max-w-[180px] px-2 py-1 text-xs"
              />
              <div className="mr-auto flex gap-1">
                <button onClick={() => moveP(i, -1)} className="rounded-lg bg-white px-2 py-1 text-xs ring-1 ring-slate-
200">
                  ↑
                </button>
                <button onClick={() => moveP(i, 1)} className="rounded-lg bg-white px-2 py-1 text-xs ring-1 ring-slate-2
00">

                  ↓
                </button>
                <button
                  onClick={async () => {
                    if (
                      !(await confirm({
                        title: " ",
                        message: ` «${p.label}»  `,
                        confirmText: "",
                        danger: true,
                      }))
                    )
                      return;
                    setProducts(products.filter((_, x) => x !== i));
                  }}
                  className="rounded-lg bg-rose-100 px-2 py-1 text-xs font-bold text-rose-700"
                >
                  
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input
            value={newProduct}
            onChange={(e) => setNewProduct(e.target.value)}
            placeholder="  ..."
            className="max-w-[220px]"
          />
          <Button
            variant="soft"
            onClick={() => {
              const label = newProduct.trim();
              if (!label) return;
              const key = `p_${Date.now()}`;
              setProducts([...products, { key, label, bonusLabel: `  ${label}`, enabled: true }]);
              setNewProduct("");
            }}
          >
              
          </Button>
          <Button onClick={() => save("products", products)}>  </Button>
          <Button variant="ghost" onClick={() => setProducts(DEFAULT_PRODUCTS)}>
             
          </Button>
        </div>
      </Card>
    </div>
  );
}
