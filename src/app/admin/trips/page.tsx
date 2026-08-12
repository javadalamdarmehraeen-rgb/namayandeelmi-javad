"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Alert, Badge, Button, Card, Input, SectionTitle } from "@/components/ui";
import { useLive } from "@/lib/useLive";
import { downloadFile } from "@/lib/download";

import { formatDistance, formatDuration } from "@/lib/tracker";
import { tehranDateTime, tehranTime, toPersianDigits } from "@/lib/jalali";
const MapBox = dynamic(() => import("@/components/MapBox"), { ssr: false });
type Trip = {
  id: number;
  userId: number;
  repName: string;
  dateShamsi: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  points: number;
  distanceM?: number;
  stopSeconds?: number;
};
type Point = {
  id: number;
  lat: number;
  lng: number;
  kind: string;
  note: string;
  stopSeconds: number;
  gpsOn: boolean;
  speed: number | null;
  recordedAt: string;
};
type Place = { lat: number; lng: number; label: string; color: string };
export default function AdminTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [onlyActive, setOnlyActive] = useState(false);
  const [rep, setRep] = useState("");
  const [q, setQ] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [dl, setDl] = useState("");
  /* ----------         ---------- */
  useEffect(() => {
    (async () => {
      const get = async (u: string) => {
        const r = await fetch(u, { cache: "no-store" }).catch(() => null);
        return r?.ok ? ((await r.json()).rows ?? []) : [];
      };
      const [ph, dr, hm] = await Promise.all([
        get("/api/records/pharmacies?limit=500"),
        get("/api/records/doctors?limit=500"),
        get("/api/homes"),
      ]);
      const out: Place[] = [];
      for (const p of ph) if (p.lat && p.lng) out.push({ lat: p.lat, lng: p.lng, label: ` ${p.name}`, color: "#0f766e"
 });
      for (const d of dr) if (d.lat && d.lng) out.push({ lat: d.lat, lng: d.lng, label: ` ${d.name}`, color: "#0369a1"
 });
      for (const h of hm)
        if (h.lat && h.lng) out.push({ lat: h.lat, lng: h.lng, label: ` ${h.title} (${h.repName})`, color: "#7c3aed" }
);
      setPlaces(out);
    })();
  }, []);
  const loadTrips = useCallback(async () => {
    const res = await fetch(`/api/trips${onlyActive ? "?active=1" : ""}`, { cache: "no-store" });
    if (res.ok) setTrips((await res.json()).rows ?? []);
  }, [onlyActive]);
  const loadPoints = useCallback(async (id: number) => {
    const res = await fetch(`/api/trips/points?tripId=${id}`, { cache: "no-store" });
    if (res.ok) setPoints((await res.json()).points ?? []);
  }, []);
  useLive(loadTrips, 15000);
  useEffect(() => {
    if (sel === null) return;
    loadPoints(sel);
    const t = setInterval(() => loadPoints(sel), 20000);
    return () => clearInterval(t);
  }, [sel, loadPoints]);
  /* ----------     ---------- */
  const reps = useMemo(() => [...new Set(trips.map((t) => t.repName))].sort(), [trips]);

  const filtered = useMemo(
    () =>
      trips.filter(
        (t) => (!rep || t.repName === rep) && (!q || `${t.repName} ${t.dateShamsi}`.toLowerCase().includes(q.toLowerCase
())),
      ),
    [trips, rep, q],
  );
  const grouped = useMemo(() => {
    const m = new Map<string, Trip[]>();
    for (const t of filtered) {
      if (!m.has(t.repName)) m.set(t.repName, []);
      m.get(t.repName)!.push(t);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);
  const selected = trips.find((t) => t.id === sel);
  const stops = points.filter((p) => p.kind === "pause");
  const totalStop = points.reduce((a, p) => a + (p.stopSeconds ?? 0), 0);
  /**      (     ) */
  const distance = useMemo(() => {
    if (selected?.distanceM) return selected.distanceM;
    let d = 0;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const R = 6371000;
      const dLat = ((b.lat - a.lat) * Math.PI) / 180;
      const dLng = ((b.lng - a.lng) * Math.PI) / 180;
      const s =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      const seg = 2 * R * Math.asin(Math.sqrt(s));
      if (seg > 5 && seg < 5000) d += seg;
    }
    return d;
  }, [points, selected]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle icon="">  </SectionTitle>
        <div className="flex flex-wrap gap-2">
          <Button variant={onlyActive ? "primary" : "ghost"} onClick={() => setOnlyActive((v) => !v)}>
            {onlyActive ? "  " : "  "}
          </Button>
          <Button variant="success" onClick={async () => setDl(await downloadFile("/api/export?type=trips", "trips.xls")
)}>
              
          </Button>
        </div>
      </div>
      {dl ? <Alert kind={dl.startsWith("") ? "error" : "success"}>{dl}</Alert> : null}
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={rep}
            onChange={(e) => {
              setRep(e.target.value);
              setSel(null);
            }}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">  ({toPersianDigits(reps.length)})</option>
            {reps.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <Input placeholder=" ..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-[200px]" />
          <Badge tone="slate">{toPersianDigits(filtered.length)} </Badge>
          <span className="mr-auto text-[11px] text-slate-500">  ·   ·   ·  </span>
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="max-h-[520px] space-y-3 overflow-y-auto">
            {grouped.map(([repName, list]) => {

              const totalDist = list.reduce((a, t) => a + (t.distanceM ?? 0), 0);
              return (
                <div key={repName}>
                  <div className="mb-1 flex flex-wrap items-center gap-2 rounded-lg bg-slate-100 px-2 py-1.5">
                    <span className="text-xs font-black text-slate-800">{repName}</span>
                    <Badge tone="slate">{toPersianDigits(list.length)} </Badge>
                    {totalDist > 0 ? <Badge tone="green">{formatDistance(totalDist)}</Badge> : null}
                    {list.some((t) => t.status === "active") ? <Badge tone="green"> </Badge> : null}
                  </div>
                  <div className="space-y-1">
                    {list.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSel(t.id)}
                        className={`w-full rounded-xl px-3 py-2 text-right text-xs ring-1 transition ${
                          sel === t.id ? "bg-teal-50 ring-teal-300" : "bg-slate-50 ring-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-700">{toPersianDigits(t.dateShamsi)}</span>
                          <Badge tone={t.status === "active" ? "green" : "slate"}>
                            {t.status === "active" ? "  " : " "}
                          </Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-slate-500">
                          <span> {tehranTime(t.startedAt)}</span>
                          {t.endedAt ? <span> {tehranTime(t.endedAt)}</span> : null}
                          <span>{toPersianDigits(t.points ?? 0)} </span>
                          {t.distanceM ? <span>{formatDistance(t.distanceM)}</span> : null}
                          {t.stopSeconds ? <span> {formatDuration(t.stopSeconds)}</span> : null}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {grouped.length === 0 ? <p className="py-6 text-center text-sm text-slate-400">  </p> : null}
          </div>
        </Card>
        <Card className="lg:col-span-2">
          {selected ? (
            <>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-sm font-black text-slate-800">{selected.repName}</span>
                <Badge tone="slate">{toPersianDigits(selected.dateShamsi)}</Badge>
                <Badge tone="green">{formatDistance(distance)}</Badge>
                <Badge tone="amber"> {formatDuration(totalStop || selected.stopSeconds || 0)}</Badge>
                <Badge tone="slate">{toPersianDigits(points.length)} </Badge>
              </div>
              <MapBox
                height={380}
                path={points.map((p) => ({ lat: p.lat, lng: p.lng }))}
                points={[
                  ...places,
                  ...points
                    .filter((p) => p.kind !== "move")
                    .map((p) => ({
                      lat: p.lat,
                      lng: p.lng,
                      label: `${
                        p.kind === "start" ? " " : p.kind === "end" ? " " : " "
                      } — ${tehranTime(p.recordedAt)}${p.stopSeconds ? ` (${formatDuration(p.stopSeconds)})` : ""}`,
                      color: p.kind === "pause" ? "#f59e0b" : p.kind === "end" ? "#e11d48" : "#16a34a",
                    })),
                ]}
              />
              <div className="mt-3 max-h-44 space-y-1 overflow-y-auto text-[11px]">
                {points
                  .filter((p) => p.kind !== "move")
                  .map((p) => (
                    <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5">
                      <span>{p.kind === "start" ? "  " : p.kind === "end" ? "  " : " "}</span>
                      <span className="text-slate-500">{tehranDateTime(p.recordedAt)}</span>
                      {p.stopSeconds ? <Badge tone="amber">{formatDuration(p.stopSeconds)}</Badge> : null}
                      {!p.gpsOn ? <Badge tone="slate">GPS </Badge> : null}
                      {p.note ? <span className="text-slate-600">{p.note}</span> : null}
                    </div>
                  ))}
                {points.length === 0 ? <p className="py-4 text-center text-slate-400">   </p> : null}
              </div>
            </>

          ) : (
            <>
              <p className="mb-2 text-center text-sm text-slate-400">
                       —          
              </p>
              <MapBox height={400} points={places} />
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
