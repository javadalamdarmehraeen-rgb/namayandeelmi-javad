"use client";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Layer } from "leaflet";
import { PROVINCE_EN_FA } from "@/lib/geo";
export type MapPoint = { lat: number; lng: number; label?: string; color?: string };
/**         (//) */
export type MapArea = { lat: number; lng: number; zoom?: number; radiusKm?: number; name?: string };
function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
/**
 *     .
 *
 *  :       OpenStreetMap  
 *  `/api/map/tiles`         403  .
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
  showIranProvinces = false,
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
  /**         */
  showIranProvinces?: boolean;
  selectedProvince?: string;
  onProvinceSelect?: (province: string) => void;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layersRef = useRef<Layer[]>([]);
  const provinceLayerRef = useRef<Layer | null>(null);

  const tileLayerRef = useRef<Layer | null>(null);
  const pickRef = useRef(onPick);
  const provinceCbRef = useRef(onProvinceSelect);
  const [tileState, setTileState] = useState<"loading" | "ready" | "fallback">("loading");
  const [mapError, setMapError] = useState("");
  pickRef.current = onPick;
  provinceCbRef.current = onProvinceSelect;
  const pointsKey = points.map((p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)},${p.label ?? ""}`).join(";");
  const pathKey = `${path.length}:${path.length ? `${path[path.length - 1].lat.toFixed(5)},${path[path.length - 1].lng.t
oFixed(5)}` : ""}`;
  const centerKey = center ? `${center.lat.toFixed(6)},${center.lng.toFixed(6)}` : "";
  const areaKey = area ? `${area.lat.toFixed(4)},${area.lng.toFixed(4)},${area.zoom ?? ""}` : "";
  useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        const L = (await import("leaflet")).default;
        if (disposed || !divRef.current || mapRef.current) return;
        const start = center ?? points[0] ?? path[0] ?? area ?? { lat: 32.4279, lng: 53.688 };
        const startZoom = points.length === 0 && path.length === 0 && area?.zoom ? area.zoom : zoom;
        const map = L.map(divRef.current, {
          attributionControl: true,
          zoomControl: true,
          preferCanvas: true,
          minZoom: 4,
          maxZoom: 19,
        }).setView([start.lat, start.lng], startZoom);
        map.attributionControl.setPrefix(false);
        //     403 /   .
        const tiles = L.tileLayer("/api/map/tiles/{z}/{x}/{y}.png", {
          maxZoom: 19,
          minZoom: 4,
          updateWhenIdle: true,
          keepBuffer: 3,
          crossOrigin: false,
          attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
        });
        let loaded = 0;
        let failed = 0;
        tiles.on("tileload", () => {
          loaded++;
          if (loaded >= 1) setTileState(failed > loaded ? "fallback" : "ready");
        });
        tiles.on("tileerror", () => {
          failed++;
          if (failed >= 3 && loaded === 0) setTileState("fallback");
        });
        tiles.addTo(map);
        tileLayerRef.current = tiles;
        map.on("click", (e: { latlng: { lat: number; lng: number } }) =>
          pickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng }),
        );
        mapRef.current = map;
        setTimeout(() => map.invalidateSize(), 150);
        drawRecords(L, map);
        if (showIranProvinces) await drawProvinces(L, map, selectedProvince);
      } catch (err) {
        setMapError(err instanceof Error ? err.message : "   ");
      }
    })();
    return () => {
      disposed = true;
      provinceLayerRef.current?.remove();
      tileLayerRef.current?.remove();
      mapRef.current?.remove();
      provinceLayerRef.current = null;
      tileLayerRef.current = null;
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
      drawRecords(L, map);
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
  useEffect(() => {
    if (!showIranProvinces || !mapRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!cancelled && mapRef.current) await drawProvinces(L, mapRef.current, selectedProvince);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showIranProvinces, selectedProvince]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function drawRecords(L: any, map: LeafletMap) {
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
        className: "sek-map-marker",
        html: `<div style="background:${p.color ?? "#0f766e"};width:18px;height:18px;border-radius:50%;border:3px solid 
#fff;box-shadow:0 2px 8px rgba(15,23,42,.45)"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      const marker = L.marker([p.lat, p.lng], { icon, draggable }).addTo(map);
      if (p.label) marker.bindTooltip(esc(p.label), { direction: "top", className: "sek-point-tooltip" });
      if (draggable) {
        marker.on("dragend", (e: { target: { getLatLng: () => { lat: number; lng: number } } }) => {
          const ll = e.target.getLatLng();
          pickRef.current?.({ lat: ll.lat, lng: ll.lng });
        });
      }
      layersRef.current.push(marker);
    }
    const all = [...points, ...path];
    if (all.length > 1) {
      map.fitBounds(
        all.map((p) => [p.lat, p.lng] as [number, number]),
        { padding: [28, 28], maxZoom: 17 },
      );
    } else if (all.length === 1) {
      map.setView([all[0].lat, all[0].lng], Math.max(map.getZoom(), 16));
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function drawProvinces(L: any, map: LeafletMap, selected: string) {

    provinceLayerRef.current?.remove();
    try {
      const res = await fetch("/data/iran-provinces.geojson", { cache: "force-cache" });
      if (!res.ok) throw new Error(`GeoJSON ${res.status}`);
      const geo = await res.json();
      const layer = L.geoJSON(geo, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        style: (feature: any) => {
          const en = String(feature?.properties?.shapeName ?? "");
          const fa = PROVINCE_EN_FA[en] ?? en;
          const active = Boolean(selected && fa === selected);
          return {
            color: active ? "#0f766e" : "#64748b",
            weight: active ? 3 : 1.3,
            opacity: 0.95,
            fillColor: active ? "#14b8a6" : "#e2e8f0",
            fillOpacity: active ? 0.28 : 0.1,
          };
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onEachFeature: (feature: any, polygon: any) => {
          const en = String(feature?.properties?.shapeName ?? "");
          const fa = PROVINCE_EN_FA[en] ?? en;
          polygon.bindTooltip(esc(fa), {
            permanent: true,
            direction: "center",
            className: `sek-province-label${selected === fa ? " is-active" : ""}`,
          });
          polygon.on("mouseover", () => polygon.setStyle({ fillOpacity: 0.32, weight: 2.5 }));
          polygon.on("mouseout", () => {
            const active = selected === fa;
            polygon.setStyle({ fillOpacity: active ? 0.28 : 0.1, weight: active ? 3 : 1.3 });
          });
          polygon.on("click", (e: { originalEvent?: { stopPropagation?: () => void } }) => {
            e.originalEvent?.stopPropagation?.();
            provinceCbRef.current?.(fa);
            try {
              map.fitBounds(polygon.getBounds(), { padding: [20, 20], maxZoom: 9 });
            } catch {
              /* ignore */
            }
          });
        },
      }).addTo(map);
      provinceLayerRef.current = layer;
      //     
      layer.bringToBack?.();
      if (!selected && points.length === 0 && path.length === 0) {
        map.fitBounds(layer.getBounds(), { padding: [8, 8] });
      }
    } catch (err) {
      setMapError(`   : ${err instanceof Error ? err.message : ""}`);
    }
  }
  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-[#eef2f1] ring-1 ring-slate-200">
      <div ref={divRef} style={{ height }} className="w-full" role="application" aria-label="" />
      {tileState === "loading" ? (
        <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-lg bg-white/90 px-2 py-1 text-[10px] f
ont-bold text-slate-500 shadow">
              ...
        </div>
      ) : null}
      {tileState === "fallback" ? (
        <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-lg bg-amber-50/95 px-2 py-1 text-[10px
] font-bold text-amber-700 shadow ring-1 ring-amber-200">
                  
        </div>
      ) : null}
      {mapError ? (
        <div className="absolute inset-x-3 bottom-3 z-[500] rounded-xl bg-rose-50/95 px-3 py-2 text-center text-[11px] f
ont-bold text-rose-700 shadow ring-1 ring-rose-200">
          {mapError}
        </div>
      ) : null}
    </div>
  );
}
