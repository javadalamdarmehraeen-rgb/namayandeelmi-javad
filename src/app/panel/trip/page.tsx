"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const MapBox = dynamic(() => import("@/components/MapBox"), { ssr: false });
import { Alert, Badge, Button, Card, SectionTitle } from "@/components/ui";
import { tehranTime, toPersianDigits, todayJalali } from "@/lib/jalali";

type QPoint = { lat: number; lng: number; accuracy?: number; kind: string; note?: string; recordedAt: string };

const LS_TRIP = "sek_trip_id";
const LS_QUEUE = "sek_trip_queue";
const LS_PATH = "sek_trip_path";

function readQueue(): QPoint[] {
  try {
    return JSON.parse(localStorage.getItem(LS_QUEUE) || "[]");
  } catch {
    return [];
  }
}
function writeQueue(q: QPoint[]) {
  localStorage.setItem(LS_QUEUE, JSON.stringify(q.slice(-1000)));
}

export default function TripPage() {
  const [tripId, setTripId] = useState<number | null>(null);
  const [active, setActive] = useState(false);
  const [path, setPath] = useState<QPoint[]>([]);
  const [queueLen, setQueueLen] = useState(0);
  const [msg, setMsg] = useState<{ kind: "info" | "error" | "success"; text: string } | null>(null);
  const [gpsOk, setGpsOk] = useState(true);
  const [startedAt, setStartedAt] = useState<string>("");
  const [home, setHome] = useState<{ lat: number; lng: number; title: string } | null>(null);
  const watchRef = useRef<number | null>(null);
  const lastSaved = useRef<number>(0);

  const flush = useCallback(async () => {
    const id = Number(localStorage.getItem(LS_TRIP));
    const q = readQueue();
    setQueueLen(q.length);
    if (!id || q.length === 0 || !navigator.onLine) return;
    const res = await fetch("/api/trips/points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId: id, points: q }),
    }).catch(() => null);
    if (res?.ok) {
      writeQueue([]);
      setQueueLen(0);
    }
  }, []);

  useEffect(() => {
    const id = Number(localStorage.getItem(LS_TRIP));
    if (id) {
      setTripId(id);
      setActive(true);
      try {
        setPath(JSON.parse(localStorage.getItem(LS_PATH) || "[]"));
      } catch {
        /* ignore */
      }
    }
    setQueueLen(readQueue().length);
    fetch("/api/homes", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const h = d?.rows?.[0];
        if (h) setHome({ lat: h.lat, lng: h.lng, title: h.title });
      })
      .catch(() => undefined);
    const t = setInterval(flush, 15000);
    window.addEventListener("online", flush);
    return () => {
      clearInterval(t);
      window.removeEventListener("online", flush);
    };
  }, [flush]);

  const pushPoint = useCallback((p: QPoint) => {
    setPath((prev) => {
      const next = [...prev, p].slice(-1000);
      localStorage.setItem(LS_PATH, JSON.stringify(next));
      return next;
    });
    const q = readQueue();
    q.push(p);
    writeQueue(q);
    setQueueLen(q.length);
  }, []);

  const startWatch = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsOk(false);
      return;
    }
    if (watchRef.current !== null) return;
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsOk(true);
        const now = Date.now();
        if (now - lastSaved.current < 10000) return;
        lastSaved.current = now;
        pushPoint({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          kind: "move",
          recordedAt: new Date().toISOString(),
        });
      },
      () => setGpsOk(false),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
  }, [pushPoint]);

  const stopWatch = useCallback(() => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (active) startWatch();
    else stopWatch();
    return () => stopWatch();
  }, [active, startWatch, stopWatch]);

  const currentPosition = () =>
    new Promise<{ lat: number; lng: number; accuracy?: number } | null>((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 12000 },
      );
    });

  const startTrip = async () => {
    setMsg({ kind: "info", text: "در حال فعال‌سازی GPS..." });
    const pos = await currentPosition();
    if (!pos) {
      setGpsOk(false);
      setMsg({ kind: "error", text: "⚠️ دسترسی به GPS برقرار نشد. لطفاً موقعیت مکانی دستگاه را روشن کنید." });
      return;
    }
    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pos),
    }).catch(() => null);
    if (!res?.ok) {
      setMsg({ kind: "error", text: "ارتباط با سرور برقرار نشد. برای شروع سفر یک بار اتصال اینترنت لازم است." });
      return;
    }
    const data = await res.json();
    localStorage.setItem(LS_TRIP, String(data.trip.id));
    localStorage.setItem(LS_PATH, "[]");
    setTripId(data.trip.id);
    setStartedAt(tehranTime(new Date()));
    setPath([{ ...pos, kind: "start", recordedAt: new Date().toISOString() }]);
    setActive(true);
    setMsg({ kind: "success", text: "🚗 ویزیت شروع شد. مسیر شما به صورت آنلاین و آفلاین ثبت می‌شود." });
  };

  const markPause = async () => {
    const pos = (await currentPosition()) ?? path[path.length - 1];
    if (!pos) return;
    pushPoint({
      lat: pos.lat,
      lng: pos.lng,
      kind: "pause",
      note: `وقفه در ساعت ${tehranTime(new Date())}`,
      recordedAt: new Date().toISOString(),
    });
    flush();
    setMsg({ kind: "info", text: `⏸ وقفه در ساعت ${tehranTime(new Date())} ثبت شد` });
  };

  const endTrip = async () => {
    const pos = await currentPosition();
    await flush();
    if (tripId) {
      await fetch("/api/trips", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tripId, action: "end", ...(pos ?? {}) }),
      }).catch(() => null);
    }
    stopWatch();
    localStorage.removeItem(LS_TRIP);
    localStorage.removeItem(LS_PATH);
    setActive(false);
    setTripId(null);
    setPath([]);
    setMsg({ kind: "success", text: "🏁 پایان ویزیت ثبت شد. GPS و نقشه غیرفعال شدند." });
  };

  const pauses = path.filter((p) => p.kind === "pause");

  return (
    <div className="space-y-4">
      <SectionTitle icon="🗺️">ثبت تردد و ویزیت — {toPersianDigits(todayJalali())}</SectionTitle>
      {msg ? <Alert kind={msg.kind}>{msg.text}</Alert> : null}

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          {!active ? (
            <Button onClick={startTrip} className="flex-1 sm:flex-none">
              ▶️ شروع ویزیت (فعال‌سازی GPS)
            </Button>
          ) : (
            <>
              <Button variant="soft" onClick={markPause}>
                ⏸ ثبت وقفه در این نقطه
              </Button>
              <Button variant="danger" onClick={endTrip}>
                ⏹ پایان ویزیت (قطع GPS و نقشه)
              </Button>
            </>
          )}
          <div className="flex-1" />
          <Badge tone={active ? "green" : "slate"}>{active ? "ویزیت فعال" : "غیرفعال"}</Badge>
          <Badge tone={gpsOk ? "green" : "amber"}>{gpsOk ? "GPS متصل" : "GPS خاموش"}</Badge>
          <Badge tone={queueLen ? "amber" : "slate"}>
            صف آفلاین: {toPersianDigits(queueLen)}
          </Badge>
        </div>
        {active ? (
          <div className="mt-2 text-xs text-slate-500">
            شروع: {startedAt || "—"} | نقاط ثبت‌شده: {toPersianDigits(path.length)} | وقفه‌ها:{" "}
            {toPersianDigits(pauses.length)}
            {!gpsOk ? " — GPS به صورت دستی خاموش شده است؛ نقشه همچنان فعال است." : ""}
          </div>
        ) : null}
      </Card>

      {active ? (
        <Card>
          <MapBox
            height={360}
            follow
            path={path.map((p) => ({ lat: p.lat, lng: p.lng }))}
            points={[
              ...path
                .filter((p) => p.kind !== "move")
                .map((p) => ({
                  lat: p.lat,
                  lng: p.lng,
                  label: p.note || (p.kind === "start" ? "شروع ویزیت" : "پایان"),
                  color: p.kind === "pause" ? "#f59e0b" : "#0f766e",
                })),
              ...(home ? [{ lat: home.lat, lng: home.lng, label: `🏠 ${home.title}`, color: "#7c3aed" }] : []),
            ]}
          />
          {pauses.length ? (
            <ul className="mt-3 space-y-1 text-xs text-slate-600">
              {pauses.map((p, i) => (
                <li key={i} className="rounded-lg bg-amber-50 px-3 py-1.5">
                  ⏸ {p.note}
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      ) : (
        <Alert kind="info">
          نقشه و GPS تنها در زمان ویزیت فعال هستند. با زدن «شروع ویزیت» موقعیت شما ثبت و برای مدیر ارسال می‌شود.
        </Alert>
      )}
    </div>
  );
}
