"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Layer } from "leaflet";

export type MapPoint = { lat: number; lng: number; label?: string; color?: string };

/** محدوده‌ای که نقشه باید روی آن متمرکز شود (استان/شهر/منطقه) */
export type MapArea = { lat: number; lng: number; zoom?: number; radiusKm?: number; name?: string };

/** نقشه سبک مبتنی بر Leaflet + OpenStreetMap (بدون کلید API) */
export default function MapBox({
  points = [],
  path = [],
  onPick,
  height = 260,
  center,
  zoom = 14,
  follow = false,
  accuracy,
  draggable = false,
  area,
}: {
  points?: MapPoint[];
  path?: { lat: number; lng: number }[];
  onPick?: (p: { lat: number; lng: number }) => void;
  height?: number;
  center?: { lat: number; lng: number } | null;
  zoom?: number;
  follow?: boolean;
  accuracy?: number | null;
  draggable?: boolean;
  /** تمرکز نقشه روی یک محدوده جغرافیایی */
  area?: MapArea | null;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layersRef = useRef<Layer[]>([]);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  const pointsKey = points.map((p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)},${p.label ?? ""}`).join(";");
  const pathKey = `${path.length}:${path.length ? `${path[path.length - 1].lat.toFixed(5)},${path[path.length - 1].lng.toFixed(5)}` : ""}`;
  const centerKey = center ? `${center.lat.toFixed(6)},${center.lng.toFixed(6)}` : "";
  const areaKey = area ? `${area.lat.toFixed(4)},${area.lng.toFixed(4)},${area.zoom ?? ""}` : "";

  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (disposed || !divRef.current || mapRef.current) return;
      const start = center ?? points[0] ?? path[0] ?? area ?? { lat: 35.6892, lng: 51.389 };
      const startZoom = points.length === 0 && path.length === 0 && area?.zoom ? area.zoom : zoom;
      const map = L.map(divRef.current, {
        attributionControl: false,
        zoomControl: true,
        preferCanvas: true,
      }).setView([start.lat, start.lng], startZoom);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, minZoom: 4 }).addTo(map);
      map.on("click", (e: { latlng: { lat: number; lng: number } }) =>
        pickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng }),
      );
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 150);
      draw(L, map);
    })();
    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      if (!map || cancelled) return;
      draw(L, map);
      // اگر محدوده مشخص شده و نقطه‌ای وجود ندارد، نقشه روی همان محدوده متمرکز می‌شود
      if (area && points.length === 0 && path.length === 0) {
        map.setView([area.lat, area.lng], area.zoom ?? 10);
        return;
      }
      const target = center ?? points[points.length - 1] ?? path[path.length - 1];
      if (follow && target) map.setView([target.lat, target.lng], map.getZoom());
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsKey, pathKey, centerKey, areaKey, accuracy]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function draw(L: any, map: LeafletMap) {
    for (const layer of layersRef.current) layer.remove();
    layersRef.current = [];

    if (path.length > 1) {
      const line = L.polyline(
        path.map((p) => [p.lat, p.lng]),
        { color: "#0d9488", weight: 4, opacity: 0.85 },
      ).addTo(map);
      layersRef.current.push(line);
    }

    if (accuracy && points[0]) {
      const circle = L.circle([points[0].lat, points[0].lng], {
        radius: accuracy,
        color: "#0ea5e9",
        weight: 1,
        fillColor: "#38bdf8",
        fillOpacity: 0.12,
      }).addTo(map);
      layersRef.current.push(circle);
    }

    for (const p of points) {
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:${p.color ?? "#0f766e"};width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 4px rgba(0,0,0,.4)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      const m = L.marker([p.lat, p.lng], { icon, draggable }).addTo(map);
      if (p.label) m.bindTooltip(p.label, { direction: "top" });
      if (draggable) {
        m.on("dragend", (e: { target: { getLatLng: () => { lat: number; lng: number } } }) => {
          const ll = e.target.getLatLng();
          pickRef.current?.({ lat: ll.lat, lng: ll.lng });
        });
      }
      layersRef.current.push(m);
    }

    const all = [...points, ...path];
    if (all.length > 1) {
      map.fitBounds(
        all.map((p) => [p.lat, p.lng] as [number, number]),
        { padding: [24, 24], maxZoom: 17 },
      );
    } else if (all.length === 1) {
      map.setView([all[0].lat, all[0].lng], Math.max(map.getZoom(), 17));
    }
  }

  return <div ref={divRef} style={{ height }} className="w-full overflow-hidden rounded-2xl ring-1 ring-slate-200" />;
}
