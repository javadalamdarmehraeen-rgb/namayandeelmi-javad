"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import LocationPicker, { type LatLng } from "@/components/LocationPicker";
import { Alert, Badge, Button, Card, Field, Input, SectionTitle, TextArea } from "@/components/ui";
import NavButton from "@/components/NavButton";
import { toPersianDigits } from "@/lib/jalali";
import { useLive } from "@/lib/useLive";
import { useConfirm } from "@/components/Confirm";

const MapBox = dynamic(() => import("@/components/MapBox"), { ssr: false });

type Home = {
  id: number;
  userId: number;
  repName: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
};

export default function HomeScreen({ isAdmin = false }: { isAdmin?: boolean }) {
  const [rows, setRows] = useState<Home[]>([]);
  const [title, setTitle] = useState("منزل");
  const [address, setAddress] = useState("");
  const [loc, setLoc] = useState<LatLng>({ lat: null, lng: null, accuracy: null });
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [repFilter, setRepFilter] = useState("");
  const confirm = useConfirm();

  const load = useCallback(async () => {
    const res = await fetch("/api/homes", { cache: "no-store" });
    if (res.ok) setRows((await res.json()).rows ?? []);
  }, []);

  useLive(load, 25000);

  const reps = [...new Set(rows.map((r) => r.repName))].sort();
  const visible = rows.filter((r) => !repFilter || r.repName === repFilter);
  const grouped = (() => {
    const m = new Map<string, Home[]>();
    for (const r of visible) {
      if (!m.has(r.repName)) m.set(r.repName, []);
      m.get(r.repName)!.push(r);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  })();

  const save = async () => {
    if (!loc.lat || !loc.lng) {
      setMsg({ kind: "error", text: "ابتدا لوکیشن منزل را روی نقشه مشخص کنید" });
      return;
    }
    if (!(await confirm({ title: "ثبت لوکیشن منزل", message: `«${title}» با موقعیت انتخاب‌شده ثبت شود؟`, confirmText: "ثبت" })))
      return;
    const res = await fetch("/api/homes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, address, ...loc }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg({ kind: "success", text: "✅ لوکیشن منزل ثبت شد و در نقشه تردد نمایش داده می‌شود" });
      load();
    } else setMsg({ kind: "error", text: d.error ?? "خطا در ثبت" });
  };

  return (
    <div className="space-y-4">
      <SectionTitle icon="🏠">{isAdmin ? "لوکیشن منزل نمایندگان" : "ثبت لوکیشن منزل"}</SectionTitle>
      {msg ? <Alert kind={msg.kind}>{msg.text}</Alert> : null}

      {!isAdmin ? (
        <Card>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="نام منزل / عنوان" required>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً منزل جواد" />
            </Field>
            <Field label="آدرس">
              <TextArea value={address} onChange={(e) => setAddress(e.target.value)} />
            </Field>
          </div>
          <div className="mt-3">
            <LocationPicker value={loc} onChange={setLoc} label={title} suggestQuery={address || title} />
          </div>
          <div className="mt-3 flex justify-end">
            <Button onClick={save}>💾 ثبت لوکیشن منزل</Button>
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-700">
            {isAdmin ? "منازل ثبت‌شده — به تفکیک نماینده" : "منزل ثبت‌شده شما"}
          </h3>
          {isAdmin && reps.length > 1 ? (
            <select
              value={repFilter}
              onChange={(e) => setRepFilter(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
            >
              <option value="">همه نمایندگان ({toPersianDigits(reps.length)})</option>
              {reps.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        {visible.length === 0 ? (
          <p className="text-sm text-slate-400">موردی ثبت نشده است</p>
        ) : (
          <>
            <MapBox
              height={300}
              points={visible.map((r) => ({
                lat: r.lat,
                lng: r.lng,
                label: `🏠 ${r.title} — ${r.repName}`,
                color: "#7c3aed",
              }))}
            />
            <div className="mt-3 space-y-2">
              {grouped.map(([repName, list]) => (
                <div key={repName}>
                  <div className="mb-1 flex items-center gap-2 rounded-lg bg-slate-100 px-2 py-1.5">
                    <span className="text-xs font-black text-slate-800">{repName}</span>
                    <Badge tone="slate">{toPersianDigits(list.length)} مورد</Badge>
                  </div>
                  {list.map((r) => (
                    <div key={r.id} className="mb-1 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs">
                      <span className="font-bold text-purple-700">🏠 {r.title}</span>
                      <span className="text-slate-500">{r.address}</span>
                      <span className="mr-auto">
                        <NavButton lat={r.lat} lng={r.lng} label={`${r.title} — ${r.repName}`} />
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
