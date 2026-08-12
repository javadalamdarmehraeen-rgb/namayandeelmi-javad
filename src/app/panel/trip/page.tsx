"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Alert, Badge, Button, Card, SectionTitle } from "@/components/ui";
import { useConfirm } from "@/components/Confirm";
import { tehranTime, toPersianDigits, todayJalali } from "@/lib/jalali";
import {
  bufferedCount,
  createTracker,

  flushPoints,
  formatDistance,
  formatDuration,
  pushLive,
  type TrackPoint,
  type TrackerState,
} from "@/lib/tracker";
const MapBox = dynamic(() => import("@/components/MapBox"), { ssr: false });
const LS_TRIP = "sek_trip_id";
const LS_STATE = "sek_trip_state";
type Place = { lat: number; lng: number; label: string; color: string };
export default function TripPage() {
  const [tripId, setTripId] = useState<number | null>(null);
  const [active, setActive] = useState(false);
  const [st, setSt] = useState<TrackerState>({
    lastPoint: null,
    distanceM: 0,
    stopSeconds: 0,
    gpsOn: true,
    pending: 0,
    points: [],
  });
  const [startedAt, setStartedAt] = useState("");
  const [msg, setMsg] = useState<{ kind: "info" | "error" | "success"; text: string } | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const trackerRef = useRef<ReturnType<typeof createTracker> | null>(null);
  const confirm = useConfirm();
  /* ----------          ---------- */
  const loadPlaces = useCallback(async () => {
    const out: Place[] = [];
    const get = async (url: string) => {
      const r = await fetch(url, { cache: "no-store" }).catch(() => null);
      return r?.ok ? ((await r.json()).rows ?? []) : [];
    };
    const [ph, dr, hm] = await Promise.all([
      get("/api/records/pharmacies?limit=300"),
      get("/api/records/doctors?limit=300"),
      get("/api/homes"),
    ]);
    for (const p of ph) if (p.lat && p.lng) out.push({ lat: p.lat, lng: p.lng, label: ` ${p.name}`, color: "#0f766e" }
);
    for (const d of dr) if (d.lat && d.lng) out.push({ lat: d.lat, lng: d.lng, label: ` ${d.name}`, color: "#0369a1" }
);
    for (const h of hm) if (h.lat && h.lng) out.push({ lat: h.lat, lng: h.lng, label: ` ${h.title}`, color: "#7c3aed" 
});
    setPlaces(out);
  }, []);
  /* ----------          ---------- */
  useEffect(() => {
    loadPlaces();
    const id = Number(localStorage.getItem(LS_TRIP));
    if (id) {
      setTripId(id);
      setActive(true);
      try {
        const saved = JSON.parse(localStorage.getItem(LS_STATE) ?? "{}");
        if (saved.startedAt) setStartedAt(saved.startedAt);
      } catch {
        /* ignore */
      }
    }
    bufferedCount().then((n) => setSt((s) => ({ ...s, pending: n })));
    //      
    const onOnline = () => void flushPoints();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [loadPlaces]);
  /* ----------       ---------- */
  useEffect(() => {
    if (!active || !tripId) return;
    const tracker = createTracker({ tripId, onUpdate: setSt });
    trackerRef.current = tracker;
    const ok = tracker.start();
    if (!ok) setMsg({ kind: "error", text: "     " });
    return () => {
      void tracker.stop(" ");
      trackerRef.current = null;

    };
  }, [active, tripId]);
  const currentPosition = () =>
    new Promise<{ lat: number; lng: number; accuracy?: number } | null>((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
      );
    });
  const startTrip = async () => {
    if (!(await confirm({ title: " ", message: "   ", confirmText: "" }))) return;
    setMsg({ kind: "info", text: "    ..." });
    const pos = await currentPosition();
    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pos ?? {}),
    }).catch(() => null);
    //             
    let id: number | null = null;
    if (res?.ok) {
      const d = await res.json();
      id = d.trip?.id ?? null;
    }
    if (!id) {
      setMsg({
        kind: "info",
        text: "                .",
      });
      id = -Date.now(); //   
    } else {
      setMsg({ kind: "success", text: "    —     (  )" });
    }
    localStorage.setItem(LS_TRIP, String(id));
    localStorage.setItem(LS_STATE, JSON.stringify({ startedAt: tehranTime(new Date()) }));
    setStartedAt(tehranTime(new Date()));
    setTripId(id);
    setActive(true);
    if (pos) void pushLive({ ...pos, gpsOn: true, tripId: id });
  };
  const markPause = async () => {
    if (!(await confirm({ title: " ", message: "     ", confirmText: "" }))) return;
    await trackerRef.current?.markPause(`  — ${tehranTime(new Date())}`);
    setMsg({ kind: "info", text: `   ${tehranTime(new Date())}  ` });
  };
  const endTrip = async () => {
    if (
      !(await confirm({
        title: " ",
        message: ` : ${formatDistance(st.distanceM)}\n: ${formatDuration(st.stopSeconds)}\n\n  
`,
        confirmText: " ",
        danger: true,
      }))
    )
      return;
    await trackerRef.current?.stop(" ");
    const pos = await currentPosition();
    if (tripId && tripId > 0) {
      await fetch("/api/trips", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tripId, action: "end", ...(pos ?? {}) }),
      }).catch(() => null);
    }
    localStorage.removeItem(LS_TRIP);
    localStorage.removeItem(LS_STATE);
    setActive(false);
    setTripId(null);
    setSt({ lastPoint: null, distanceM: 0, stopSeconds: 0, gpsOn: true, pending: 0, points: [] });
    setMsg({ kind: "success", text: "    " });
  };
  const pauses = st.points.filter((p: TrackPoint) => p.kind === "pause");
  const path = st.points.map((p) => ({ lat: p.lat, lng: p.lng }));

  return (
    <div className="space-y-4">
      <SectionTitle icon="">    — {toPersianDigits(todayJalali())}</SectionTitle>
      {msg ? <Alert kind={msg.kind}>{msg.text}</Alert> : null}
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          {!active ? (
            <Button onClick={startTrip} className="flex-1 sm:flex-none">
                
            </Button>
          ) : (
            <>
              <Button variant="soft" onClick={markPause}>
                  
              </Button>
              <Button variant="danger" onClick={endTrip}>
                  
              </Button>
            </>
          )}
          <div className="flex-1" />
          <Badge tone={active ? "green" : "slate"}>{active ? "  " : ""}</Badge>
          <Badge tone={st.gpsOn ? "green" : "amber"}>{st.gpsOn ? "GPS " : "GPS  —  "}</Badge>
          {st.pending > 0 ? <Badge tone="amber">{toPersianDigits(st.pending)}   </Badge> : null}
        </div>
        {active ? (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              [" ", formatDistance(st.distanceM), "bg-teal-50 text-teal-700"],
              [" ", formatDuration(st.stopSeconds), "bg-amber-50 text-amber-700"],
              [" ", toPersianDigits(st.points.length), "bg-slate-50 text-slate-700"],
              [" ", startedAt || "—", "bg-sky-50 text-sky-700"],
            ].map(([l, v, c]) => (
              <div key={l} className={`rounded-xl p-2.5 text-center ring-1 ring-slate-200 ${c}`}>
                <div className="text-sm font-black">{v}</div>
                <div className="text-[10px] font-bold opacity-70">{l}</div>
              </div>
            ))}
          </div>
        ) : null}
        {!st.gpsOn && active ? (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
             GPS       —          .
          </p>
        ) : null}
      </Card>
      <Card>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-700">
            {active ? "  " : "     "}
          </h3>
          <span className="text-[11px] text-slate-500">
              ·   ·   ·  
          </span>
        </div>
        <MapBox
          height={380}
          follow={active}
          path={path}
          points={[
            ...places,
            ...st.points
              .filter((p) => p.kind !== "move")
              .map((p) => ({
                lat: p.lat,
                lng: p.lng,
                label: p.note || (p.kind === "start" ? " " : ""),
                color: p.kind === "pause" ? "#f59e0b" : p.kind === "end" ? "#e11d48" : "#16a34a",
              })),
          ]}
        />
        {pauses.length ? (
          <ul className="mt-3 space-y-1 text-xs text-slate-600">
            {pauses.map((p, i) => (
              <li key={i} className="rounded-lg bg-amber-50 px-3 py-1.5">
                 {p.note} — {tehranTime(p.recordedAt)}
              </li>
            ))}
          </ul>
        ) : null}

      </Card>
      {!active ? (
        <Alert kind="info">
            « »    .      GPS      
                  —   .
        </Alert>
      ) : null}
    </div>
  );
}
