"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Layer } from "leaflet";

export type MapPoint = { lat: number; lng: number; label?: string; color?: string };
export type MapArea = { lat: number; lng: number; zoom?: number; radiusKm?: number; name?: string };

type GeoCollection = { type: "FeatureCollection"; features: Array<{ type: "Feature"; properties?: Record<string, unknown>; geometry: unknown }> };

/**
 * نقشه آفلاین-اول:
 * - جهان و مرز ۳۱ استان از فایل‌های برداری محلی (بدون اینترنت)
 * - کاشی‌های جزئی از مسیر داخلی /api/tiles دریافت و بعد از اولین مشاهده کش می‌شوند
 * - استان‌ها قابل کلیک و دارای برچسب نام هستند
 */
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
  showWorld = true,
  showProvinces = false,
  selectedProvince = "",
  onProvinceSelect,
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
  area?: MapArea | null;
  showWorld?: boolean;
  showProvinces?: boolean;
  selectedProvince?: string;
  onProvinceSelect?: (name: string) => void;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layersRef = useRef<Layer[]>([]);
  const baseVectorRef = useRef<Layer[]>([]);
  const worldRef = useRef<GeoCollection | null>(null);
  const provincesRef = useRef<GeoCollection | null>(null);
  const pickRef = useRef(onPick);
  const provincePickRef = useRef(onProvinceSelect);
  pickRef.current = onPick;
  provincePickRef.current = onProvinceSelect;

  const pointsKey = points.map((p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)},${p.label ?? ""}`).join(";");
  const pathKey = `${path.length}:${path.length ? `${path[path.length - 1].lat.toFixed(5)},${path[path.length - 1].lng.toFixed(5)}` : ""}`;
  const centerKey = center ? `${center.lat.toFixed(6)},${center.lng.toFixed(6)}` : "";
  const areaKey = area ? `${area.lat.toFixed(4)},${area.lng.toFixed(4)},${area.zoom ?? ""}` : "";

  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (disposed || !divRef.current || mapRef.current) return;

      const start = center ?? points[0] ?? path[0] ?? area ?? { lat: 32.4279, lng: 53.688 };
      const startZoom = points.length === 0 && path.length === 0 && area?.zoom ? area.zoom : points.length ? zoom : 5;
      const map = L.map(divRef.current, {
        attributionControl: false,
        zoomControl: true,
        preferCanvas: true,
        minZoom: 2,
        worldCopyJump: true,
      }).setView([start.lat, start.lng], startZoom);

      // مسیر داخلی: سرویس‌ورکر کاشی‌های دیده‌شده را برای آفلاین نگه می‌دارد
      L.tileLayer("/api/tiles/{z}/{x}/{y}", {
        maxZoom: 18,
        minZoom: 2,
        keepBuffer: 4,
        updateWhenIdle: true,
        errorTileUrl: "/icons/icon-96.png",
      }).addTo(map);

      map.on("click", (e: { latlng: { lat: number; lng: number } }) =>
        pickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng }),
      );
      mapRef.current = map;

      // فایل‌ها محلی‌اند و در حالت آفلاین هم خوانده می‌شوند
      const [world, provinces] = await Promise.all([
        showWorld
          ? fetch("/data/world-countries.geojson").then((r) => (r.ok ? r.json() : null)).catch(() => null)
          : null,
        showProvinces
          ? fetch("/data/iran-provinces.geojson").then((r) => (r.ok ? r.json() : null)).catch(() => null)
          : null,
      ]);
      worldRef.current = world;
      provincesRef.current = provinces;
      drawBase(L, map);
      drawData(L, map);
      setTimeout(() => map.invalidateSize(), 150);
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
      drawBase(L, map);
      drawData(L, map);
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
  }, [pointsKey, pathKey, centerKey, areaKey, accuracy, selectedProvince, showProvinces]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function drawBase(L: any, map: LeafletMap) {
    for (const layer of baseVectorRef.current) layer.remove();
    baseVectorRef.current = [];

    if (showWorld && worldRef.current) {
      const world = L.geoJSON(worldRef.current, {
        style: { color: "#94a3b8", weight: 0.7, fillColor: "#e2e8f0", fillOpacity: 0.38 },
        interactive: false,
      }).addTo(map);
      baseVectorRef.current.push(world);
    }

    if (showProvinces && provincesRef.current) {
      const layer = L.geoJSON(provincesRef.current, {
        style: (feature: { properties?: Record<string, unknown> }) => {
          const name = String(feature?.properties?.name ?? "");
          const active = selectedProvince && name === selectedProvince;
          return {
            color: active ? "#e11d48" : "#0f766e",
            weight: active ? 3 : 1.25,
            fillColor: active ? "#fb7185" : "#14b8a6",
            fillOpacity: active ? 0.28 : 0.1,
          };
        },
        onEachFeature: (feature: { properties?: Record<string, unknown> }, polygon: any) => {
          const name = String(feature?.properties?.name ?? "استان");
          polygon.bindTooltip(name, {
            permanent: true,
            direction: "center",
            className: "iran-province-label",
          });
          polygon.on("click", (e: Event) => {
            // مانع ثبت نقطه هنگام انتخاب استان
            (e as unknown as { originalEvent?: { stopPropagation?: () => void } }).originalEvent?.stopPropagation?.();
            provincePickRef.current?.(name);
            try {
              map.fitBounds(polygon.getBounds(), { padding: [20, 20] });
            } catch {
              /* ignore */
            }
          });
        },
      }).addTo(map);
      baseVectorRef.current.push(layer);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function drawData(L: any, map: LeafletMap) {
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
      map.setView([all[0].lat, all[0].lng], Math.max(map.getZoom(), 16));
    }
  }

  return (
    <div
      ref={divRef}
      style={{ height, background: "linear-gradient(180deg,#dbeafe 0%,#f8fafc 70%)" }}
      className="w-full overflow-hidden rounded-2xl ring-1 ring-slate-200"
    />
  );
}
