"use client";
import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Alert, Badge, Button, Card, SectionTitle } from "@/components/ui";
import { useLive } from "@/lib/useLive";
import { formatDistance } from "@/lib/tracker";
import { tehranDateTime, tehranTime, toPersianDigits } from "@/lib/jalali";
import NavButton from "@/components/NavButton";
const MapBox = dynamic(() => import("@/components/MapBox"), { ssr: false });
type Live = {
  userId: number;
  repName: string;
  lat: number;
  lng: number;
  accuracy: number | null;

  speed: number | null;
  battery: number | null;
  gpsOn: boolean;
  tripId: number | null;
  recordedAt: string;
  updatedAt: string;
  ageMs: number;
  live: boolean;
  stale: boolean;
  activeTrip: { id: number; distanceM: number } | null;
};
const ageLabel = (ms: number) => {
  const m = Math.floor(ms / 60000);
  if (m < 1) return " ";
  if (m < 60) return `${toPersianDigits(m)}  `;
  const h = Math.floor(m / 60);
  if (h < 24) return `${toPersianDigits(h)}  `;
  return `${toPersianDigits(Math.floor(h / 24))}  `;
};
export default function LivePage() {
  const [rows, setRows] = useState<Live[]>([]);
  const [missing, setMissing] = useState<{ userId: number; repName: string }[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const load = useCallback(async () => {
    const res = await fetch("/api/live", { cache: "no-store" });
    if (!res.ok) return;
    const d = await res.json();
    setRows(d.rows ?? []);
    setMissing(d.missing ?? []);
  }, []);
  const { refresh } = useLive(load, 12000, autoRefresh);
  const focused = useMemo(() => rows.find((r) => r.userId === selected) ?? null, [rows, selected]);
  const online = rows.filter((r) => r.live).length;
  const onTrip = rows.filter((r) => r.activeTrip).length;
  const mapPoints = (focused ? [focused] : rows).map((r) => ({
    lat: r.lat,
    lng: r.lng,
    label: `${r.repName} — ${r.live ? " " : "  "} (${ageLabel(r.ageMs)})`,
    color: r.live ? (r.activeTrip ? "#16a34a" : "#0ea5e9") : r.stale ? "#f59e0b" : "#94a3b8",
  }));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle icon="">  </SectionTitle>
        <div className="flex flex-wrap gap-2">
          <Badge tone="green"> : {toPersianDigits(online)}</Badge>
          <Badge tone="amber">   : {toPersianDigits(onTrip)}</Badge>
          <Button variant={autoRefresh ? "success" : "ghost"} onClick={() => setAutoRefresh((v) => !v)}>
            {autoRefresh ? "  (  )" : " "}
          </Button>
          <Button variant="ghost" onClick={refresh}>
             
          </Button>
        </div>
      </div>
      <Alert kind="info">
             GPS             
           .
      </Alert>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700"></h3>
            {focused ? (
              <button onClick={() => setSelected(null)} className="text-[11px] font-bold text-teal-700">
                 
              </button>
            ) : null}
          </div>
          <div className="max-h-[460px] space-y-2 overflow-y-auto">
            {rows.map((r) => (
              <button
                key={r.userId}
                onClick={() => setSelected(selected === r.userId ? null : r.userId)}

                className={`w-full rounded-xl px-3 py-2 text-right ring-1 transition ${
                  selected === r.userId ? "bg-teal-50 ring-teal-300" : "bg-slate-50 ring-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-black text-slate-800">{r.repName}</span>
                  <Badge tone={r.live ? "green" : r.stale ? "amber" : "slate"}>
                    {r.live ? " " : r.stale ? " " : " "}
                  </Badge>
                  {r.activeTrip ? <Badge tone="green"> </Badge> : null}
                  {!r.gpsOn ? <Badge tone="amber">GPS </Badge> : null}
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-slate-500">
                  <span>{ageLabel(r.ageMs)}</span>
                  {r.accuracy ? <span> {toPersianDigits(Math.round(r.accuracy))}</span> : null}
                  {r.speed ? <span> {toPersianDigits(Math.round(r.speed * 3.6))} km/h</span> : null}
                  {r.battery !== null ? <span> {toPersianDigits(r.battery)}</span> : null}
                  {r.activeTrip ? <span> {formatDistance(r.activeTrip.distanceM)}</span> : null}
                </div>
                <div className="mt-1 text-[10px] text-slate-400">{tehranDateTime(r.updatedAt)}</div>
              </button>
            ))}
            {rows.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">    </p>
            ) : null}
            {missing.length ? (
              <div className="rounded-xl bg-slate-100 p-2 text-[11px] text-slate-500">
                 : {missing.map((m) => m.repName).join(" ")}
              </div>
            ) : null}
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-700">
              {focused ? ` ${focused.repName}` : "  "}
            </h3>
            {focused ? (
              <div className="flex items-center gap-2">
                <NavButton lat={focused.lat} lng={focused.lng} label={focused.repName} />
                <span className="text-[11px] text-slate-500" dir="ltr">
                  {focused.lat.toFixed(5)}, {focused.lng.toFixed(5)}
                </span>
              </div>
            ) : null}
          </div>
          <MapBox height={430} points={mapPoints} follow={!!focused} />
          {focused ? (
            <div className="mt-3 grid grid-cols-2 gap-2 text-center text-[11px] sm:grid-cols-4">
              {[
                [" ", tehranTime(focused.updatedAt)],
                [" GPS", focused.gpsOn ? "" : ""],
                [" ", focused.accuracy ? `${toPersianDigits(Math.round(focused.accuracy))} ` : "—"],
                [" ", focused.activeTrip ? formatDistance(focused.activeTrip.distanceM) : "—"],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200">
                  <div className="font-black text-slate-800">{v}</div>
                  <div className="text-[10px] text-slate-500">{l}</div>
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
