"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Marker, Polyline } from "leaflet";

export type MapPoint = { lat: number; lng: number; label?: string; color?: string };

export default function MapBox({
  points = [],
  path = [],
  onPick,
  height = 260,
  center,
  zoom = 13,
  follow = false,
}: {
  points?: MapPoint[];
  path?: { lat: number; lng: number }[];
  onPick?: (p: { lat: number; lng: number }) => void;
  height?: number;
  center?: { lat: number; lng: number } | null;
  zoom?: number;
  follow?: boolean;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layersRef = useRef<(Marker | Polyline)[]>([]);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (disposed || !divRef.current || mapRef.current) return;
      const start = center ?? points[0] ?? path[0] ?? { lat: 35.6892, lng: 51.389 };
      const map = L.map(divRef.current, { attributionControl: false, zoomControl: true }).setView(
        [start.lat, start.lng],
        zoom,
      );
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        pickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 200);
      draw(L, map);
    })();
    return () => {
      disposed = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      if (!map) return;
      draw(L, map);
      const target = center ?? points[points.length - 1] ?? path[path.length - 1];
      if (follow && target) map.setView([target.lat, target.lng], map.getZoom());
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points), JSON.stringify(path), JSON.stringify(center ?? null)]);

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
    for (const p of points) {
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:${p.color ?? "#0f766e"};width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 1px ${p.color ?? "#0f766e"}"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      const m = L.marker([p.lat, p.lng], { icon }).addTo(map);
      if (p.label) m.bindTooltip(p.label, { direction: "top" });
      layersRef.current.push(m);
    }
    const all = [...points, ...path];
    if (all.length > 1) {
      map.fitBounds(
        all.map((p) => [p.lat, p.lng] as [number, number]),
        { padding: [24, 24], maxZoom: 16 },
      );
    } else if (all.length === 1) {
      map.setView([all[0].lat, all[0].lng], Math.max(map.getZoom(), 15));
    }
  }

  return (
    <div
      ref={divRef}
      style={{ height }}
      className="w-full overflow-hidden rounded-2xl ring-1 ring-slate-200"
      role="application"
    />
  );
}
