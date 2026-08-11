"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import nextDynamic from "next/dynamic";
import { Alert, Badge, Button, Card, Field, Input, SectionTitle } from "@/components/ui";
import Combobox from "@/components/Combobox";
import NavButton from "@/components/NavButton";
import { fetchRows } from "@/lib/useLive";
import { IRAN_CENTER, PROVINCE_GEO, TEHRAN_REGIONS, resolveArea } from "@/lib/geo";
import { toPersianDigits } from "@/lib/jalali";
import type { MapArea, MapPoint } from "@/components/MapBox";
const MapBox = nextDynamic(() => import("@/components/MapBox"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-400">
         ...
    </div>
  ),
});
type Place = {
  id: number;
  kind: "pharmacy" | "doctor" | "home";
  name: string;
  repName: string;

  province: string;
  city: string;
  region: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
  extra: string;
};
const KIND_META: Record<Place["kind"], { label: string; icon: string; color: string }> = {
  pharmacy: { label: "", icon: "", color: "#0f766e" },
  doctor: { label: "", icon: "", color: "#0369a1" },
  home: { label: " ", icon: "", color: "#7c3aed" },
};
/**
 *  :        
 *    /  /  /    .
 */
export default function MapExplorer({ isAdmin = false }: { isAdmin?: boolean }) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [kinds, setKinds] = useState<Record<Place["kind"], boolean>>({
    pharmacy: true,
    doctor: true,
    home: true,
  });
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [rep, setRep] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Place | null>(null);
  /* ----------------   ---------------- */
  const load = useCallback(async () => {
    setLoading(true);
    const [ph, dr, hm] = await Promise.all([
      fetchRows<Record<string, unknown>>("/api/records/pharmacies?limit=1000"),
      fetchRows<Record<string, unknown>>("/api/records/doctors?limit=1000"),
      fetchRows<Record<string, unknown>>("/api/homes"),
    ]);
    const out: Place[] = [];
    const push = (kind: Place["kind"], r: Record<string, unknown>, name: string, extra = "") => {
      const lat = Number(r.lat);
      const lng = Number(r.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || (!lat && !lng)) return;
      out.push({
        id: Number(r.id),
        kind,
        name,
        repName: String(r.repName ?? ""),
        province: String(r.province ?? ""),
        city: String(r.city ?? ""),
        region: String(r.region ?? ""),
        phone: String(r.managerPhone ?? r.phone ?? ""),
        address: String(r.address ?? ""),
        lat,
        lng,
        extra,
      });
    };
    for (const r of ph) push("pharmacy", r, String(r.name ?? ""), String(r.managerName ?? ""));
    for (const r of dr) push("doctor", r, String(r.name ?? ""), String(r.specialty ?? ""));
    for (const r of hm) push("home", r, String(r.title ?? ""), String(r.repName ?? ""));
    setPlaces(out);
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  /* ----------------   ---------------- */
  const provinces = useMemo(
    () => [...new Set([...Object.keys(PROVINCE_GEO), ...places.map((p) => p.province)])].filter(Boolean).sort(),
    [places],
  );
  const cities = useMemo(
    () =>

      [...new Set(places.filter((p) => !province || p.province === province).map((p) => p.city))]
        .filter(Boolean)
        .sort(),
    [places, province],
  );
  const regions = useMemo(() => {
    const fromData = places.filter((p) => (!city || p.city === city)).map((p) => p.region);
    const base = city === "" ? Object.values(TEHRAN_REGIONS).map((r) => r.name) : [];
    return [...new Set([...base, ...fromData])].filter(Boolean).sort();
  }, [places, city]);
  const reps = useMemo(() => [...new Set(places.map((p) => p.repName))].filter(Boolean).sort(), [places]);
  /* ----------------   ---------------- */
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return places.filter((p) => {
      if (!kinds[p.kind]) return false;
      if (province && p.province !== province) return false;
      if (city && p.city !== city) return false;
      if (region && p.region !== region) return false;
      if (rep && p.repName !== rep) return false;
      if (term && !`${p.name} ${p.repName} ${p.city} ${p.address} ${p.extra}`.toLowerCase().includes(term))
        return false;
      return true;
    });
  }, [places, kinds, province, city, region, rep, q]);
  /**        */
  const area: MapArea = useMemo(() => {
    const g = resolveArea(province, city, region);
    return { lat: g.lat, lng: g.lng, zoom: g.zoom, radiusKm: g.radiusKm, name: g.name };
  }, [province, city, region]);
  const mapPoints: MapPoint[] = useMemo(
    () =>
      (selected ? [selected] : filtered).map((p) => ({
        lat: p.lat,
        lng: p.lng,
        label: `${KIND_META[p.kind].icon} ${p.name}${p.repName ? ` — ${p.repName}` : ""}`,
        color: KIND_META[p.kind].color,
      })),
    [filtered, selected],
  );
  const counts = useMemo(
    () => ({
      pharmacy: filtered.filter((p) => p.kind === "pharmacy").length,
      doctor: filtered.filter((p) => p.kind === "doctor").length,
      home: filtered.filter((p) => p.kind === "home").length,
    }),
    [filtered],
  );
  const reset = () => {
    setProvince("");
    setCity("");
    setRegion("");
    setRep("");
    setQ("");
    setSelected(null);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle icon="">  —    </SectionTitle>
        <div className="flex flex-wrap gap-2">
          <Badge tone="green"> {toPersianDigits(counts.pharmacy)}</Badge>
          <Badge tone="slate"> {toPersianDigits(counts.doctor)}</Badge>
          <Badge tone="amber"> {toPersianDigits(counts.home)}</Badge>
          <Button variant="ghost" onClick={load}>
             
          </Button>
        </div>
      </div>
      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="">
            <Combobox
              value={province}
              onChange={(v) => {
                setProvince(v);
                setCity("");
                setRegion("");

                setSelected(null);
              }}
              options={provinces}
              selectOnly
              placeholder=" "
            />
          </Field>
          <Field label="">
            <Combobox
              value={city}
              onChange={(v) => {
                setCity(v);
                setRegion("");
                setSelected(null);
              }}
              options={cities}
              selectOnly
              placeholder={province ? "   " : "    "}
            />
          </Field>
          <Field label="">
            <Combobox
              value={region}
              onChange={(v) => {
                setRegion(v);
                setSelected(null);
              }}
              options={regions}
              selectOnly
              placeholder=" "
            />
          </Field>
          <Field label={isAdmin ? "" : ""}>
            {isAdmin ? (
              <select
                value={rep}
                onChange={(e) => {
                  setRep(e.target.value);
                  setSelected(null);
                }}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              >
                <option value=""> </option>
                {reps.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            ) : (
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="  ..." />
            )}
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(Object.keys(KIND_META) as Place["kind"][]).map((k) => (
            <button
              key={k}
              onClick={() => setKinds({ ...kinds, [k]: !kinds[k] })}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold ring-1 transition ${
                kinds[k] ? "bg-teal-50 text-teal-700 ring-teal-300" : "bg-slate-100 text-slate-400 ring-slate-200"
              }`}
            >
              {KIND_META[k].icon} {KIND_META[k].label} {kinds[k] ? "" : ""}
            </button>
          ))}
          {isAdmin ? (
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder=" ..." className="max-w-[200px]" 
/>
          ) : null}
          <div className="flex-1" />
          <Badge tone="slate">: {area.name ?? IRAN_CENTER.name}</Badge>
          <Button variant="ghost" onClick={reset}>
              
          </Button>
        </div>
      </Card>
      {loading ? <Alert kind="info">   ...</Alert> : null}
      {!loading && filtered.length === 0 ? (
        <Alert kind="info">
               .           .
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <MapBox
            height={520}
            points={mapPoints}
            area={area}
            follow={!!selected}
            showIranProvinces
            selectedProvince={province}
            onProvinceSelect={(name) => {
              setProvince(name);
              setCity("");
              setRegion("");
              setSelected(null);
            }}
          />
          {selected ? (
            <div className="mt-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-black text-slate-800">
                  {KIND_META[selected.kind].icon} {selected.name}
                </span>
                {selected.extra ? <Badge tone="slate">{selected.extra}</Badge> : null}
                {selected.repName ? <Badge tone="green">{selected.repName}</Badge> : null}
                <div className="mr-auto flex items-center gap-2">
                  <NavButton lat={selected.lat} lng={selected.lng} label={selected.name} />
                  <button onClick={() => setSelected(null)} className="text-[11px] font-bold text-slate-500">
                    
                  </button>
                </div>
              </div>
              {selected.address ? <p className="mt-1 text-[11px] text-slate-600">{selected.address}</p> : null}
              <p className="text-[10px] text-slate-400" dir="ltr">
                {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
              </p>
            </div>
          ) : null}
        </Card>
        <Card className="lg:col-span-1">
          <h3 className="mb-2 text-sm font-bold text-slate-700">
              ({toPersianDigits(filtered.length)})
          </h3>
          <div className="max-h-[520px] space-y-1 overflow-y-auto">
            {filtered.slice(0, 300).map((p) => (
              <button
                key={`${p.kind}-${p.id}`}
                onClick={() => setSelected(selected?.id === p.id && selected.kind === p.kind ? null : p)}
                className={`w-full rounded-xl px-3 py-2 text-right ring-1 transition ${
                  selected?.id === p.id && selected.kind === p.kind
                    ? "bg-teal-50 ring-teal-300"
                    : "bg-slate-50 ring-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800">
                    {KIND_META[p.kind].icon} {p.name}
                  </span>
                  {p.extra ? <span className="text-[10px] text-slate-500">{p.extra}</span> : null}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-2 text-[10px] text-slate-500">
                  {p.city ? <span>{p.city}</span> : null}
                  {p.region ? <span>{p.region}</span> : null}
                  {p.repName ? <span> {p.repName}</span> : null}
                  {p.phone ? <span>{toPersianDigits(p.phone)}</span> : null}
                </div>
              </button>
            ))}
            {filtered.length > 300 ? (
              <p className="py-2 text-center text-[11px] text-slate-400">
                {toPersianDigits(filtered.length - 300)}   —    
              </p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
