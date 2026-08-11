"use client";
/**
 * ============================================================
 *     (Offline-First GPS Tracker)
 * ------------------------------------------------------------
 *  :
 *   •     IndexedDB   
 *   •           
 *   •           
 *   •   GPS       
 *              
 *   •          «»  
 * ============================================================
 */
export type TrackPoint = {
  lat: number;
  lng: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  kind: "start" | "move" | "pause" | "end";
  note?: string;
  stopSeconds?: number;
  gpsOn?: boolean;
  recordedAt: string;
};
const DB_NAME = "sek-track";
const STORE = "points";
const MIN_DISTANCE_M = 12; //       ( GPS)
const STOP_THRESHOLD_MS = 2 * 60 * 1000; //     
/* ------------------------------ IndexedDB ------------------------------ */
function idb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => {
      const d = r.result;
      if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

export async function bufferPoint(tripId: number, p: TrackPoint) {
  try {
    const d = await idb();
    await new Promise<void>((res) => {
      const tx = d.transaction(STORE, "readwrite");
      tx.objectStore(STORE).add({ tripId, ...p });
      tx.oncomplete = () => res();
      tx.onerror = () => res();
    });
  } catch {
    /*     —         */
  }
}
export async function bufferedPoints(): Promise<(TrackPoint & { id: number; tripId: number })[]> {
  try {
    const d = await idb();
    return await new Promise((res) => {
      const tx = d.transaction(STORE, "readonly");
      const rq = tx.objectStore(STORE).getAll();
      rq.onsuccess = () => res(rq.result ?? []);
      rq.onerror = () => res([]);
    });
  } catch {
    return [];
  }
}
async function removePoints(ids: number[]) {
  if (!ids.length) return;
  try {
    const d = await idb();
    const tx = d.transaction(STORE, "readwrite");
    const st = tx.objectStore(STORE);
    for (const id of ids) st.delete(id);
  } catch {
    /* ignore */
  }
}
export async function bufferedCount() {
  return (await bufferedPoints()).length;
}
/* ------------------------------  ------------------------------ */
export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
export function formatDistance(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} ` : `${Math.round(m)} `;
}
export function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}   ${m} `;
  if (m > 0) return `${m} `;
  return `${Math.round(sec)} `;
}
/* ------------------------------  ------------------------------ */
/**     .      . */
export async function flushPoints(): Promise<{ sent: number; pending: number }> {
  const all = await bufferedPoints();
  if (all.length === 0) return { sent: 0, pending: 0 };
  const byTrip = new Map<number, typeof all>();
  for (const p of all) {
    if (!byTrip.has(p.tripId)) byTrip.set(p.tripId, []);
    byTrip.get(p.tripId)!.push(p);
  }
  let sent = 0;
  for (const [tripId, points] of byTrip) {
    const chunk = points.slice(0, 200);

    try {
      const res = await fetch("/api/trips/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          points: chunk.map(({ id, tripId: _t, ...rest }) => {
            void id;
            void _t;
            return rest;
          }),
        }),
      });
      if (res.ok) {
        await removePoints(chunk.map((c) => c.id));
        sent += chunk.length;
      }
    } catch {
      break; //  —    
    }
  }
  return { sent, pending: (await bufferedPoints()).length };
}
/**    (  ) —     */
export async function pushLive(p: {
  lat: number;
  lng: number;
  accuracy?: number | null;
  speed?: number | null;
  gpsOn?: boolean;
  tripId?: number | null;
  battery?: number | null;
}) {
  try {
    await fetch("/api/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, recordedAt: new Date().toISOString() }),
    });
  } catch {
    /*  —    */
  }
}
/* ------------------------------  ------------------------------ */
export type TrackerState = {
  lastPoint: TrackPoint | null;
  distanceM: number;
  stopSeconds: number;
  gpsOn: boolean;
  pending: number;
  points: TrackPoint[];
};
export type TrackerOptions = {
  tripId: number;
  onUpdate: (s: TrackerState) => void;
};
/**
 *  .  `start()`    `stop()`  .
 *  GPS      .
 */
export function createTracker({ tripId, onUpdate }: TrackerOptions) {
  let watchId: number | null = null;
  let flushTimer: ReturnType<typeof setInterval> | null = null;
  let liveTimer: ReturnType<typeof setInterval> | null = null;
  const state: TrackerState = {
    lastPoint: null,
    distanceM: 0,
    stopSeconds: 0,
    gpsOn: true,
    pending: 0,
    points: [],
  };
  let lastMoveAt = Date.now();
  let lastSavedAt = 0;
  const emit = () => onUpdate({ ...state, points: [...state.points] });
  const record = async (p: TrackPoint) => {

    state.points.push(p);
    if (state.points.length > 2000) state.points.shift();
    state.lastPoint = p;
    await bufferPoint(tripId, p);
    state.pending = await bufferedCount();
    emit();
  };
  const onPosition = async (pos: GeolocationPosition) => {
    state.gpsOn = true;
    const now = Date.now();
    const cur = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    //  
    if (!state.lastPoint) {
      lastMoveAt = now;
      lastSavedAt = now;
      await record({
        ...cur,
        accuracy: pos.coords.accuracy,
        speed: pos.coords.speed,
        heading: pos.coords.heading,
        kind: "start",
        note: " ",
        gpsOn: true,
        recordedAt: new Date().toISOString(),
      });
      return;
    }
    const dist = haversine(state.lastPoint, cur);
    //     
    if (dist < MIN_DISTANCE_M) {
      const stopped = now - lastMoveAt;
      if (stopped >= STOP_THRESHOLD_MS && now - lastSavedAt >= STOP_THRESHOLD_MS) {
        lastSavedAt = now;
        state.stopSeconds += Math.round(stopped / 1000);
        await record({
          ...cur,
          accuracy: pos.coords.accuracy,
          kind: "pause",
          note: ` ${formatDuration(stopped / 1000)}`,
          stopSeconds: Math.round(stopped / 1000),
          gpsOn: true,
          recordedAt: new Date().toISOString(),
        });
        lastMoveAt = now;
      }
      return;
    }
    //  
    state.distanceM += dist;
    lastMoveAt = now;
    lastSavedAt = now;
    await record({
      ...cur,
      accuracy: pos.coords.accuracy,
      speed: pos.coords.speed,
      heading: pos.coords.heading,
      kind: "move",
      gpsOn: true,
      recordedAt: new Date().toISOString(),
    });
  };
  const onError = () => {
    // GPS     —   
    state.gpsOn = false;
    emit();
  };
  const start = () => {
    if (!("geolocation" in navigator)) return false;
    if (watchId !== null) return true;
    watchId = navigator.geolocation.watchPosition(onPosition, onError, {
      enableHighAccuracy: true,
      maximumAge: 15000,
      timeout: 30000,
    });
    //     ()
    flushTimer = setInterval(async () => {

      const r = await flushPoints();
      state.pending = r.pending;
      emit();
    }, 20000);
    //      GPS  
    liveTimer = setInterval(() => {
      if (state.lastPoint) {
        void pushLive({
          lat: state.lastPoint.lat,
          lng: state.lastPoint.lng,
          accuracy: state.lastPoint.accuracy,
          speed: state.lastPoint.speed,
          gpsOn: state.gpsOn,
          tripId,
        });
      }
    }, 30000);
    return true;
  };
  const stop = async (note = " ") => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    if (flushTimer) clearInterval(flushTimer);
    if (liveTimer) clearInterval(liveTimer);
    if (state.lastPoint) {
      await record({ ...state.lastPoint, kind: "end", note, recordedAt: new Date().toISOString() });
    }
    await flushPoints();
  };
  const markPause = async (note: string) => {
    if (!state.lastPoint) return;
    await record({ ...state.lastPoint, kind: "pause", note, recordedAt: new Date().toISOString() });
    await flushPoints();
  };
  return { start, stop, markPause, state, flush: flushPoints };
}
