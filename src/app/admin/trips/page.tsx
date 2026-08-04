"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MapBox = dynamic(() => import("@/components/MapBox"), { ssr: false });
import { Badge, Button, Card, SectionTitle } from "@/components/ui";
import { tehranDateTime, tehranTime, toPersianDigits } from "@/lib/jalali";

type Trip = {
  id: number;
  repName: string;
  dateShamsi: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  points: number;
};
type Point = { id: number; lat: number; lng: number; kind: string; note: string; recordedAt: string };

export default function AdminTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [onlyActive, setOnlyActive] = useState(false);
  const [homes, setHomes] = useState<{ lat: number; lng: number; repName: string; title: string }[]>([]);

  const loadTrips = useCallback(async () => {
    const res = await fetch(`/api/trips${onlyActive ? "?active=1" : ""}`, { cache: "no-store" });
    if (res.ok) setTrips((await res.json()).rows ?? []);
  }, [onlyActive]);

  const loadPoints = useCallback(async (id: number) => {
    const res = await fetch(`/api/trips/points?tripId=${id}`, { cache: "no-store" });
    if (res.ok) setPoints((await res.json()).points ?? []);
  }, []);

  useEffect(() => {
    fetch("/api/homes", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setHomes(d?.rows ?? []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    loadTrips();
    const t = setInterval(loadTrips, 25000);
    return () => clearInterval(t);
  }, [loadTrips]);

  useEffect(() => {
    if (sel === null) return;
    loadPoints(sel);
    const t = setInterval(() => loadPoints(sel), 20000);
    return () => clearInterval(t);
  }, [sel, loadPoints]);

  const selected = trips.find((t) => t.id === sel);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle icon="🗺️">رصد تردد نمایندگان (آنلاین و آفلاین)</SectionTitle>
        <div className="flex gap-2">
          <Button variant={onlyActive ? "primary" : "ghost"} onClick={() => setOnlyActive((v) => !v)}>
            {onlyActive ? "نمایش همه سفرها" : "فقط ویزیت‌های فعال"}
          </Button>
          <a
            href="/api/export?type=trips"
            className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white"
          >
            ⬇️ خروجی اکسل
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="max-h-[520px] space-y-2 overflow-y-auto">
            {trips.map((t) => (
              <button
                key={t.id}
                onClick={() => setSel(t.id)}
                className={`w-full rounded-xl px-3 py-2 text-right text-xs ring-1 transition ${
                  sel === t.id ? "bg-teal-50 ring-teal-300" : "bg-slate-50 ring-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{t.repName}</span>
                  <Badge tone={t.status === "active" ? "green" : "slate"}>
                    {t.status === "active" ? "در حال ویزیت" : "پایان یافته"}
                  </Badge>
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  {toPersianDigits(t.dateShamsi)} — شروع {tehranTime(t.startedAt)}
                  {t.endedAt ? ` | پایان ${tehranTime(t.endedAt)}` : ""}
                </div>
                <div className="text-[11px] text-slate-400">نقاط ثبت‌شده: {toPersianDigits(t.points ?? 0)}</div>
              </button>
            ))}
            {trips.length === 0 ? <p className="text-sm text-slate-400">سفری ثبت نشده است</p> : null}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          {selected ? (
            <>
              <div className="mb-2 text-sm font-bold text-slate-700">
                مسیر {selected.repName} — {toPersianDigits(selected.dateShamsi)}
              </div>
              <MapBox
                height={380}
                path={points.map((p) => ({ lat: p.lat, lng: p.lng }))}
                points={[
                  ...points
                    .filter((p) => p.kind !== "move")
                    .map((p) => ({
                      lat: p.lat,
                      lng: p.lng,
                      label: `${p.kind === "start" ? "شروع" : p.kind === "end" ? "پایان" : "وقفه"} - ${tehranTime(p.recordedAt)}`,
                      color: p.kind === "pause" ? "#f59e0b" : p.kind === "end" ? "#e11d48" : "#0f766e",
                    })),
                  ...homes
                    .filter((h) => h.repName === selected.repName)
                    .map((h) => ({ lat: h.lat, lng: h.lng, label: `🏠 ${h.title}`, color: "#7c3aed" })),
                ]}
              />
              <div className="mt-3 max-h-40 space-y-1 overflow-y-auto text-[11px]">
                {points
                  .filter((p) => p.kind !== "move")
                  .map((p) => (
                    <div key={p.id} className="rounded-lg bg-slate-50 px-3 py-1.5">
                      {p.kind === "start" ? "▶️ شروع ویزیت" : p.kind === "end" ? "🏁 پایان سفر" : "⏸ وقفه"} —{" "}
                      {tehranDateTime(p.recordedAt)} {p.note ? `(${p.note})` : ""}
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <p className="py-16 text-center text-sm text-slate-400">یک سفر را از فهرست انتخاب کنید</p>
          )}
        </Card>
      </div>
    </div>
  );
}
