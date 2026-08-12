import { getSessionUser } from "@/lib/auth";
import { fetchWithRetry } from "@/lib/retry";
export const dynamic = "force-dynamic";
/**
 *     (Geocoding) —   .
 *
 *       CORS    
 *             .
 *
 * GET /api/geocode?q=  
 * GET /api/geocode?lat=35.7&lng=51.4        ( :  → )
 */
type Hit = { label: string; lat: number; lng: number; type: string };
const UA = "SabtEtelaatKol/1.0 (contact: admin@ndcohub.ir)";
async function nominatim(q: string): Promise<Hit[]> {
  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&accept-language=fa` +
    `&countrycodes=ir&q=${encodeURIComponent(q)}`;
  const res = await fetchWithRetry(
    url,
    { headers: { "User-Agent": UA, "Accept-Language": "fa" } },
    { retries: 2, timeoutMs: 12000, label: "geocode" },

  );
  const data = (await res.json()) as { display_name: string; lat: string; lon: string; type?: string }[];
  return data.map((d) => ({
    label: d.display_name,
    lat: Number(d.lat),
    lng: Number(d.lon),
    type: d.type ?? "",
  }));
}
async function photon(q: string): Promise<Hit[]> {
  // lat/lon       
  const url =
    `https://photon.komoot.io/api/?limit=10&lang=default&lat=32.4279&lon=53.6880` +
    `&q=${encodeURIComponent(q)}`;
  const res = await fetchWithRetry(url, {}, { retries: 1, timeoutMs: 10000, label: "geocode2" });
  const data = (await res.json()) as {
    features: { properties: Record<string, string>; geometry: { coordinates: [number, number] } }[];
  };
  return (data.features ?? [])
    .filter((f) => {
      const c = (f.properties?.countrycode ?? "").toUpperCase();
      return !c || c === "IR"; //    
    })
    .map((f) => {
      const p = f.properties ?? {};
      const label = [p.name, p.street, p.district, p.city, p.county, p.state].filter(Boolean).join(" ");
      return {
        label: label || p.name || "",
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        type: p.osm_value ?? "",
      };
    })
    .filter((h) => h.label);
}
async function reverse(lat: number, lng: number): Promise<Hit[]> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=fa&lat=${lat}&lon=${lng}`;
  const res = await fetchWithRetry(
    url,
    { headers: { "User-Agent": UA, "Accept-Language": "fa" } },
    { retries: 2, timeoutMs: 12000, label: "revgeo" },
  );
  const d = (await res.json()) as { display_name?: string };
  return d?.display_name ? [{ label: d.display_name, lat, lng, type: "reverse" }] : [];
}
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  // : Number(null)          
  //      «    »  .
  const latRaw = url.searchParams.get("lat");
  const lngRaw = url.searchParams.get("lng");
  const lat = latRaw === null ? NaN : Number(latRaw);
  const lng = lngRaw === null ? NaN : Number(lngRaw);
  try {
    if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
      return Response.json({ results: await reverse(lat, lng) }, { headers: { "Cache-Control": "no-store" } });
    }
    if (q.length < 2) return Response.json({ results: [] });
    //      : «35.7219, 51.4089»
    const coord = q.match(/^\s*(-?\d{1,2}\.\d+)\s*[,]\s*(-?\d{1,3}\.\d+)\s*$/);
    if (coord) {
      const la = Number(coord[1]);
      const ln = Number(coord[2]);
      return Response.json({
        results: [{ label: ` : ${la}, ${ln}`, lat: la, lng: ln, type: "coords" }],
      });
    }
    /**
     *            .
     * Photon       Nominatim  /search
     *         .
     */
    const providers: { name: string; run: () => Promise<Hit[]> }[] = [
      { name: "photon", run: () => photon(q) },

      { name: "nominatim", run: () => nominatim(q) },
    ];
    let results: Hit[] = [];
    const notes: string[] = [];
    for (const p of providers) {
      try {
        const r = await p.run();
        if (r.length) {
          results = r;
          notes.push(`${p.name}: ${r.length}`);
          break;
        }
        notes.push(`${p.name}: 0`);
      } catch (e) {
        notes.push(`${p.name}: ${(e instanceof Error ? e.message : String(e)).slice(0, 60)}`);
      }
    }
    return Response.json(
      { results, provider: notes.join(" | ") },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return Response.json(
      { results: [], error: err instanceof Error ? err.message : "  " },
      { status: 200 },
    );
  }
}
