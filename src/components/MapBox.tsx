"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Layer } from "leaflet";

export type MapPoint = {
  lat: number;
  lng: number;
  label?: string;
  color?: string;
  /** برچسب همیشه کنار نقطه دیده شود (بدون نیاز به کلیک) */
  permanent?: boolean;
};

export type MapArea = {
  /** مرز منطقه/شهر/استان به‌صورت دایره تقریبی */
  lat: number;
  lng: number;
  radiusM: number;
  label?: string;
  color?: string;
};

/**
 * نقشه سبک مبتنی بر Leaflet + OpenStreetMap.
 *
 * ویژگی‌ها:
 *  • برچسب دائمی کنار هر نقطه (قابل خواندن بدون کلیک)
 *  • زوم خودکار روی نقطه/مسیر (نه نمای کلی کشور)
 *  • نمایش محدوده استان/شهر/منطقه
 */
export default function MapBox({
  points = [],
  path = [],
  areas = [],
  onPick,
  height = 260,
  center,
  zoom = 15,
  follow = false,
  accuracy,
  draggable = false,
  labels = true,
  fitPadding = 40,
}: {
  points?: MapPoint[];
  path?: { lat: number; lng: number }[];
  areas?: MapArea[];
  onPick?: (p: { lat: number; lng: number }) => void;
  height?: number;
  center?: { lat: number; lng: number } | null;
  zoom?: number;
  follow?: boolean;
  accuracy?: number | null;
  draggable?: boolean;
  /** نمایش نام کنار نقطه‌ها */
  labels?: boolean;
  fitPadding?: number;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layersRef = useRef<Layer[]>([]);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  const pointsKey = points.map((p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)},${p.label ?? ""}`).join(";");
  const pathKey = `${path.length}:${path.length ? `${path[path.length - 1].lat.toFixed(5)},${path[path.length - 1].lng.toFixed(5)}` : ""}`;
  const areaKey = areas.map((a) => `${a.lat.toFixed(4)},${a.lng.toFixed(4)},${a.radiusM}`).join(";");
  const centerKey = center ? `${center.lat.toFixed(6)},${center.lng.toFixed(6)}` : "";

  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (disposed || !divRef.current || mapRef.current) return;
      const start = center ?? points[0] ?? path[0] ?? areas[0] ?? { lat: 35.6892, lng: 51.389 };
      const map = L.map(divRef.current, {
        attributionControl: false,
        zoomControl: true,
        preferCanvas: true,
      }).setView([start.lat, start.lng], zoom);
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
      const target = center ?? points[points.length - 1] ?? path[path.length - 1];
      if (follow && target) map.setView([target.lat, target.lng], map.getZoom());
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsKey, pathKey, areaKey, centerKey, accuracy]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function draw(L: any, map: LeafletMap) {
    for (const layer of layersRef.current) layer.remove();
    layersRef.current = [];

    /* ---------- محدوده استان / شهر / منطقه ---------- */
    for (const a of areas) {
      const circle = L.circle([a.lat, a.lng], {
        radius: a.radiusM,
        color: a.color ?? "#0f766e",
        weight: 2,
        dashArray: "6 6",
        fillColor: a.color ?? "#0f766e",
        fillOpacity: 0.07,
      }).addTo(map);
      if (a.label) {
        circle.bindTooltip(a.label, {
          permanent: true,
          direction: "center",
          className: "sek-area-label",
        });
      }
      layersRef.current.push(circle);
    }

    /* ---------- مسیر تردد ---------- */
    if (path.length > 1) {
      const line = L.polyline(
        path.map((p) => [p.lat, p.lng]),
        { color: "#0d9488", weight: 5, opacity: 0.9, lineJoin: "round" },
      ).addTo(map);
      layersRef.current.push(line);

      // فلش جهت حرکت روی مسیر
      const mid = Math.floor(path.length / 2);
      if (path[mid] && path[mid - 1]) {
        const angle =
          (Math.atan2(path[mid].lat - path[mid - 1].lat, path[mid].lng - path[mid - 1].lng) * 180) / Math.PI;
        const arrow = L.marker([path[mid].lat, path[mid].lng], {
          icon: L.divIcon({
            className: "",
            html: `<div style="transform:rotate(${-angle}deg);font-size:18px;line-height:1">➤</div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          }),
        }).addTo(map);
        layersRef.current.push(arrow);
      }
    }

    /* ---------- دایره دقت ---------- */
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

    /* ---------- نقاط با برچسب دائمی ---------- */
    const showLabels = labels && points.length <= 120; // در تعداد زیاد، برچسب‌ها شلوغ می‌شوند
    for (const p of points) {
      const color = p.color ?? "#0f766e";
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 4px rgba(0,0,0,.45)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const m = L.marker([p.lat, p.lng], { icon, draggable }).addTo(map);
      if (p.label) {
        m.bindTooltip(p.label, {
          permanent: p.permanent ?? showLabels,
          direction: "right",
          offset: [10, 0],
          className: "sek-point-label",
        });
      }
      if (draggable) {
        m.on("dragend", (e: { target: { getLatLng: () => { lat: number; lng: number } } }) => {
          const ll = e.target.getLatLng();
          pickRef.current?.({ lat: ll.lat, lng: ll.lng });
        });
      }
      layersRef.current.push(m);
    }

    /* ---------- زوم هوشمند: مستقیم روی نقطه/مسیر ---------- */
    const all = [...points, ...path];
    if (areas.length === 1 && all.length === 0) {
      const a = areas[0];
      map.fitBounds(
        L.circle([a.lat, a.lng], { radius: a.radiusM }).getBounds(),
        { padding: [fitPadding, fitPadding] },
      );
    } else if (all.length > 1) {
      map.fitBounds(
        all.map((p) => [p.lat, p.lng] as [number, number]),
        { padding: [fitPadding, fitPadding], maxZoom: 17 },
      );
    } else if (all.length === 1) {
      // یک نقطه → زوم نزدیک تا کاربر دقیقاً محل را ببیند
      map.setView([all[0].lat, all[0].lng], Math.max(zoom, 17), { animate: true });
    }
  }

  return <div ref={divRef} style={{ height }} className="w-full overflow-hidden rounded-2xl ring-1 ring-slate-200" />;
}
