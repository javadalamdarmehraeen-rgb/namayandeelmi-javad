"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Badge, Button, Input } from "./ui";
import { toPersianDigits } from "@/lib/jalali";
const MapBox = dynamic(() => import("./MapBox"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[240px] items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-400">
         ...
    </div>
  ),
});
export type LatLng = { lat: number | null; lng: number | null; accuracy: number | null };
type Hit = { label: string; lat: number; lng: number; type: string };
/**
 *     :
 *   )     ( +  )
 *   )    GPS (  )
 *   )       /   
 */
export default function LocationPicker({
  value,
  onChange,
  label,
  height = 260,
  /**     (   + ) */

  suggestQuery = "",
}: {
  value: LatLng;
  onChange: (v: LatLng) => void;
  label?: string;
  height?: number;
  suggestQuery?: string;
}) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  // ---   ---
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchMsg, setSearchMsg] = useState("");
  const [openList, setOpenList] = useState(false);
  const [address, setAddress] = useState("");
  const watchRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bestRef = useRef<number>(Number.POSITIVE_INFINITY);
  const boxRef = useRef<HTMLDivElement>(null);
  /* -------------------------   ------------------------- */
  const runSearch = useCallback(async (q: string, silent = false) => {
    const term = q.trim();
    if (term.length < 2) {
      setHits([]);
      if (!silent) setSearchMsg("    ");
      return;
    }
    setSearching(true);
    if (!silent) setSearchMsg("  ...");
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(term)}`, { cache: "no-store" });
      const d = await res.json();
      const list: Hit[] = d.results ?? [];
      setHits(list);
      setOpenList(list.length > 0);
      setSearchMsg(
        list.length ? `${toPersianDigits(list.length)}  —    ` : "  ",
      );
    } catch {
      setSearchMsg("   —       ");
    } finally {
      setSearching(false);
    }
  }, []);
  /**       */
  useEffect(() => {
    if (autoRef.current) clearTimeout(autoRef.current);
    const term = query.trim();
    if (term.length < 3) {
      setHits([]);
      return;
    }
    autoRef.current = setTimeout(() => void runSearch(term, true), 800);
    return () => {
      if (autoRef.current) clearTimeout(autoRef.current);
    };
  }, [query, runSearch]);
  /**      */
  useEffect(() => {
    if (!openList) return;
    const h = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpenList(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [openList]);
  const pickHit = (h: Hit) => {
    onChange({ lat: h.lat, lng: h.lng, accuracy: 0 });
    setQuery(h.label);
    setAddress(h.label);
    setOpenList(false);
    setSearchMsg("      —       ");
  };
  /**      */

  const reverseLookup = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`, { cache: "no-store" });
      const d = await res.json();
      if (d.results?.[0]?.label) setAddress(d.results[0].label);
    } catch {
      /* ignore */
    }
  }, []);
  /* -------------------------  GPS ------------------------- */
  const stop = useCallback(() => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setBusy(false);
  }, []);
  useEffect(() => () => stop(), [stop]);
  const locate = () => {
    if (!navigator.geolocation) {
      setStatus("     ");
      return;
    }
    if (!window.isSecureContext) setStatus(" GPS    https  ");
    stop();
    bestRef.current = Number.POSITIVE_INFINITY;
    setBusy(true);
    setStatus("     ... (  )");
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const acc = pos.coords.accuracy ?? 9999;
        if (acc < bestRef.current) {
          bestRef.current = acc;
          onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: acc });
          setStatus(` : ${Math.round(acc)}  —       `);
        }
        if (acc <= 8) {
          stop();
          setStatus(`    ${Math.round(acc)}   `);
          void reverseLookup(pos.coords.latitude, pos.coords.longitude);
        }
      },
      (err) => {
        stop();
        setStatus(
          err.code === 1
            ? "     .          ."
            : "    —     .",
        );
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );
    timerRef.current = setTimeout(() => {
      stop();
      if (bestRef.current === Number.POSITIVE_INFINITY) {
        setStatus("          ");
      } else {
        setStatus(`  : ${Math.round(bestRef.current)} `);
        if (value.lat && value.lng) void reverseLookup(value.lat, value.lng);
      }
    }, 15000);
  };
  const acc = value.accuracy ?? null;
  const accTone = acc === null ? "amber" : acc <= 20 ? "green" : acc <= 60 ? "amber" : "slate";
  return (
    <div className="space-y-2">
      {/* ----------------   ---------------- */}
      <div className="relative" ref={boxRef}>
        <div className="flex gap-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => hits.length && setOpenList(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {

                e.preventDefault();
                void runSearch(query);
              }
            }}
            placeholder="     ... (:   )"
          />
          <Button variant="soft" onClick={() => void runSearch(query)} disabled={searching}>
            {searching ? "..." : " "}
          </Button>
          {suggestQuery.trim() ? (
            <Button
              variant="ghost"
              onClick={() => {
                setQuery(suggestQuery);
                void runSearch(suggestQuery);
              }}
              title="    "
            >
              
            </Button>
          ) : null}
        </div>
        {searchMsg ? <p className="mt-1 text-[11px] text-slate-500">{searchMsg}</p> : null}
        {openList && hits.length > 0 ? (
          <div className="fade-in absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl bg-white py-1 shadow-xl 
ring-1 ring-slate-200">
            {hits.map((h, i) => (
              <button
                key={`${h.lat}-${h.lng}-${i}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickHit(h)}
                className="block w-full px-3 py-2 text-right text-xs leading-5 text-slate-700 hover:bg-teal-50"
              >
                 {h.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {/* ---------------- GPS   ---------------- */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="soft" onClick={locate} disabled={busy}>
          {busy ? "   ..." : "   "}
        </Button>
        {busy ? (
          <Button
            variant="ghost"
            onClick={() => {
              stop();
              setStatus("  ");
            }}
          >
            
          </Button>
        ) : null}
        {value.lat && value.lng ? (
          <>
            <Badge tone={accTone as "green" | "amber" | "slate"}>
              {acc ? ` ≈ ${toPersianDigits(Math.round(acc))} ` : " "}
            </Badge>
            <Button variant="ghost" onClick={() => void reverseLookup(value.lat!, value.lng!)}>
                  
            </Button>
          </>
        ) : (
          <Badge tone="amber">  </Badge>
        )}
      </div>
      {status ? <p className="text-[11px] text-slate-500">{status}</p> : null}
      {address ? (
        <p className="rounded-lg bg-slate-50 px-2 py-1.5 text-[11px] text-slate-600 ring-1 ring-slate-200">
           {address}
        </p>
      ) : null}
      <p className="text-[11px] text-slate-400">
                       .
      </p>
      <MapBox
        height={height}

        draggable
        accuracy={acc}
        points={value.lat && value.lng ? [{ lat: value.lat, lng: value.lng, label: label || "" }] : []}
        onPick={(p) => onChange({ lat: p.lat, lng: p.lng, accuracy: 0 })}
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="  (lat)"
          value={value.lat ?? ""}
          onChange={(e) => onChange({ ...value, lat: Number(e.target.value) || null })}
          className="text-left text-xs"
        />
        <Input
          placeholder="  (lng)"
          value={value.lng ?? ""}
          onChange={(e) => onChange({ ...value, lng: Number(e.target.value) || null })}
          className="text-left text-xs"
        />
      </div>
    </div>
  );
}
