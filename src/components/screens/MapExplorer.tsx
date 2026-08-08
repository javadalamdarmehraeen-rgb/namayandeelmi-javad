"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Badge, Button, Card, Field, SectionTitle } from "@/components/ui";
import Combobox from "@/components/Combobox";
import NavButton from "@/components/NavButton";
import { fetchJson } from "@/lib/useLive";
import { IRAN_CENTER, PROVINCE_GEO, TEHRAN_REGIONS, resolveArea } from "@/lib/geo";
import { toPersianDigits } from "@/lib/jalali";
import type { MapArea, MapPoint } from "@/components/MapBox";

const MapBox = dynamic(() => import("@/components/MapBox"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-400">
      در حال بارگذاری نقشه...
    </div>
  ),
});

type Rec = {
  id: number;
  name?: string;
  pharmacyName?: string;
  province?: string;
  city?: string;
  region?: string;
  lat?: number | null;
  lng?: number | null;
  repName: string;
};
type Home = { id: number; lat: number; lng: number; title: string; repName: string };

/**
 * نقشه ایران با پیمایش سلسله‌مراتبی:
 * کل کشور → استان → شهر → منطقه
 * با نمایش داروخانه‌ها، پزشکان و منازل در همان محدوده.
 */
export default function MapExplorer() {
  const [opts, setOpts] = useState<Record<string, string[]>>({});
  const [tree, setTree] = useState<Record<string, Record<string, string[]>>>({});
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");

  const [pharm, setPharm] = useState<Rec[]>([]);
  const [docs, setDocs] = useState<Rec[]>([]);
  const [homes, setHomes] = useState<Home[]>([]);
  const [show, setShow] = useState({ ph: true, dr: true, hm: true, areas: true });
  const [labels, setLabels] = useState(true);

  /* ---------- بارگذاری داده‌ها (با کش سبک) ---------- */
  const load = useCallback(async () => {
    const o = await fetchJson<{ rows?: { category: string; value: string; parent?: string }[] }>(
      "/api/options",
      300000,
    );
    if (o?.rows) {
      const g: Record<string, string[]> = {};
      const t: Record<string, Record<string, string[]>> = {};
      for (const r of o.rows) {
        (g[r.category] ??= []).push(r.value);
        ((t[r.category] ??= {})[r.parent ?? ""] ??= []).push(r.value);
      }
      setOpts(g);
      setTree(t);
    }
    const [p, d, h] = await Promise.all([
      fetchJson<{ rows?: Rec[] }>("/api/records/pharmacies?limit=1000", 60000),
      fetchJson<{ rows?: Rec[] }>("/api/records/doctors?limit=1000", 60000),
      fetchJson<{ rows?: Home[] }>("/api/homes", 60000),
    ]);
    if (p?.rows) setPharm(p.rows);
    if (d?.rows) setDocs(d.rows);
    if (h?.rows) setHomes(h.rows);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------- فیلتر بر اساس انتخاب ---------- */
  const inScope = useCallback(
    (r: Rec) =>
      (!province || r.province === province) && (!city || r.city === city) && (!region || r.region === region),
    [province, city, region],
  );

  const points = useMemo(() => {
    const out: MapPoint[] = [];
    if (show.ph)
      for (const r of pharm)
        if (r.lat && r.lng && inScope(r))
          out.push({ lat: r.lat, lng: r.lng, label: `🏥 ${r.name}`, color: "#0f766e" });
    if (show.dr)
      for (const r of docs)
        if (r.lat && r.lng && inScope(r))
          out.push({ lat: r.lat, lng: r.lng, label: `🩺 ${r.name}`, color: "#0369a1" });
    if (show.hm)
      for (const h of homes)
        if (h.lat && h.lng) out.push({ lat: h.lat, lng: h.lng, label: `🏠 ${h.title} — ${h.repName}`, color: "#7c3aed" });
    return out;
  }, [pharm, docs, homes, show, inScope]);

  /* ---------- محدوده‌های نمایشی روی نقشه ---------- */
  const areas = useMemo(() => {
    if (!show.areas) return [];
    const out: MapArea[] = [];

    // نمای کلی کشور → همه استان‌ها
    if (!province) {
      for (const [name, g] of Object.entries(PROVINCE_GEO)) {
        out.push({ lat: g.lat, lng: g.lng, radiusM: g.radiusM, label: name, color: "#0f766e" });
      }
      return out;
    }

    // استان انتخاب شده → شهرهای همان استان
    if (province && !city) {
      const cities = tree.city?.[province] ?? [];
      const pg = PROVINCE_GEO[province];
      if (pg) out.push({ ...pg, label: province, color: "#0f766e" });
      for (const c of cities.slice(0, 40)) {
        const a = resolveArea(province, c);
        if (a && a !== IRAN_CENTER) out.push({ ...a, label: c, color: "#0ea5e9" });
      }
      return out;
    }

    // شهر انتخاب شده → مناطق همان شهر
    if (city && !region) {
      const a = resolveArea(province, city);
      out.push({ ...a, label: city, color: "#0ea5e9" });
      const regions = tree.region?.[city] ?? (city === "تهران" ? Object.keys(TEHRAN_REGIONS) : []);
      for (const r of regions.slice(0, 30)) {
        const ra = resolveArea(province, city, r);
        out.push({ ...ra, label: r, color: "#6366f1" });
      }
      return out;
    }

    // منطقه انتخاب شده → همان منطقه پررنگ
    const ra = resolveArea(province, city, region);
    out.push({ ...ra, label: `${city} — ${region}`, color: "#e11d48" });
    return out;
  }, [province, city, region, tree, show.areas]);

  const center = useMemo(() => {
    const a = resolveArea(province, city, region);
    return { lat: a.lat, lng: a.lng };
  }, [province, city, region]);

  const zoom = region ? 14 : city ? 12 : province ? 9 : 5;

  const counts = {
    ph: pharm.filter((r) => r.lat && r.lng && inScope(r)).length,
    dr: docs.filter((r) => r.lat && r.lng && inScope(r)).length,
    hm: homes.filter((h) => h.lat && h.lng).length,
  };

  const reset = () => {
    setProvince("");
    setCity("");
    setRegion("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle icon="🗺️">نقشه ایران — استان، شهر و منطقه</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <Badge tone="green">🏥 {toPersianDigits(counts.ph)}</Badge>
          <Badge tone="slate">🩺 {toPersianDigits(counts.dr)}</Badge>
          <Badge tone="amber">🏠 {toPersianDigits(counts.hm)}</Badge>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="استان" hint="با انتخاب استان، نقشه روی همان استان زوم می‌شود">
            <Combobox
              value={province}
              onChange={(v) => {
                setProvince(v);
                setCity("");
                setRegion("");
              }}
              options={opts.province ?? []}
              selectOnly
              placeholder="کل ایران"
            />
          </Field>
          <Field label="شهر" hint="شهرهای همان استان">
            <Combobox
              value={city}
              onChange={(v) => {
                setCity(v);
                setRegion("");
              }}
              options={tree.city?.[province] ?? []}
              selectOnly
              parent={province}
              parentLabel="استان"
              requireParent
              placeholder="همه شهرها"
            />
          </Field>
          <Field label="منطقه" hint="مناطق همان شهر">
            <Combobox
              value={region}
              onChange={setRegion}
              options={tree.region?.[city] ?? (city === "تهران" ? Object.keys(TEHRAN_REGIONS) : [])}
              selectOnly
              parent={city}
              parentLabel="شهر"
              requireParent
              placeholder="همه مناطق"
            />
          </Field>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={reset}>
            🌍 نمایش کل ایران
          </Button>
          <span className="mx-1 h-6 w-px bg-slate-200" />
          {[
            ["ph", "🏥 داروخانه‌ها"],
            ["dr", "🩺 پزشکان"],
            ["hm", "🏠 منازل"],
            ["areas", "🗺 محدوده‌ها"],
          ].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setShow((s) => ({ ...s, [k]: !s[k as keyof typeof s] }))}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold ring-1 ${
                show[k as keyof typeof show]
                  ? "bg-teal-50 text-teal-700 ring-teal-200"
                  : "bg-slate-100 text-slate-400 ring-slate-200"
              }`}
            >
              {l}
            </button>
          ))}
          <button
            onClick={() => setLabels((v) => !v)}
            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold ring-1 ${
              labels ? "bg-sky-50 text-sky-700 ring-sky-200" : "bg-slate-100 text-slate-400 ring-slate-200"
            }`}
          >
            🏷 نام‌ها
          </button>
          {province ? (
            <span className="mr-auto">
              <NavButton lat={center.lat} lng={center.lng} label={region || city || province} />
            </span>
          ) : null}
        </div>

        <p className="mt-2 text-[11px] text-slate-500">
          {region
            ? `منطقه «${region}» در شهر ${city} پررنگ شده است`
            : city
              ? `شهر ${city} با همه مناطق آن نمایش داده می‌شود`
              : province
                ? `استان ${province} با همه شهرهای آن نمایش داده می‌شود`
                : "نمای کلی کشور — یک استان انتخاب کنید تا نقشه روی آن زوم شود"}
        </p>
      </Card>

      <Card>
        <MapBox
          height={540}
          center={center}
          zoom={zoom}
          points={points}
          areas={areas}
          labels={labels}
          fitPadding={30}
        />
      </Card>
    </div>
  );
}
