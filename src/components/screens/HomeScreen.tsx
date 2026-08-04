"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import LocationPicker, { type LatLng } from "@/components/LocationPicker";
import { Alert, Button, Card, Field, Input, SectionTitle, TextArea } from "@/components/ui";

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

  const load = useCallback(async () => {
    const res = await fetch("/api/homes", { cache: "no-store" });
    if (res.ok) setRows((await res.json()).rows ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
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
            <LocationPicker value={loc} onChange={setLoc} label={title} />
          </div>
          <div className="mt-3 flex justify-end">
            <Button onClick={save}>💾 ثبت لوکیشن منزل</Button>
          </div>
        </Card>
      ) : null}

      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">
          {isAdmin ? "همه منازل ثبت‌شده" : "منزل ثبت‌شده شما"}
        </h3>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-400">موردی ثبت نشده است</p>
        ) : (
          <>
            <MapBox
              height={300}
              points={rows.map((r) => ({ lat: r.lat, lng: r.lng, label: `${r.repName} — ${r.title}`, color: "#7c3aed" }))}
            />
            <ul className="mt-3 space-y-1 text-xs">
              {rows.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                  <span className="font-bold text-slate-700">{r.repName}</span>
                  <span className="text-purple-700">🏠 {r.title}</span>
                  <span className="text-slate-500">{r.address}</span>
                  <a
                    className="mr-auto font-bold text-teal-700 underline"
                    href={`https://www.google.com/maps?q=${r.lat},${r.lng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    نقشه
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}
