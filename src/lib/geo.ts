/**
 * ============================================================
 *      
 * ------------------------------------------------------------
 *         :
 *   •    / 
 *   •         
 * ============================================================
 */
export type GeoArea = {
  /**     */
  name: string;
  lat: number;
  lng: number;
  /**    */
  zoom: number;
  /**       */
  radiusKm: number;
};
/**     GeoJSON →    */
export const PROVINCE_EN_FA: Record<string, string> = {
  Tehran: "",
  Alborz: "",
  Isfahan: "",
  Fars: "",
  "Razavi Khorasan": " ",
  "East Azerbaijan": " ",
  "West Azerbaijan": " ",
  Khuzestan: "",
  Gilan: "",
  Mazandaran: "",
  Kerman: "",
  Qom: "",
  Yazd: "",
  Hamadan: "",
  Kermanshah: "",
  Golestan: "",
  Ardabil: "",
  Qazvin: "",
  Zanjan: "",
  Markazi: "",
  Lorestan: "",
  Kurdistan: "",

  Hormozgan: "",
  Bushehr: "",
  Semnan: "",
  "Sistan and Baluchestan": "  ",
  "Chaharmahal and Bakhtiari": "  ",
  "Kohgiluyeh and Boyer-Ahmad": "  ",
  "North Khorasan": " ",
  "South Khorasan": " ",
  Ilam: "",
};
/**    —    */
export const IRAN_CENTER: GeoArea = {
  name: "",
  lat: 32.4279,
  lng: 53.688,
  zoom: 5,
  radiusKm: 900,
};
/**     */
export const PROVINCE_GEO: Record<string, GeoArea> = {
  : { name: "", lat: 35.6892, lng: 51.389, zoom: 10, radiusKm: 70 },
  : { name: "", lat: 35.8327, lng: 50.9916, zoom: 10, radiusKm: 45 },
  : { name: "", lat: 32.6546, lng: 51.668, zoom: 8, radiusKm: 180 },
  : { name: "", lat: 29.5918, lng: 52.5837, zoom: 8, radiusKm: 200 },
  " ": { name: " ", lat: 36.2605, lng: 59.6168, zoom: 8, radiusKm: 200 },
  " ": { name: " ", lat: 38.0962, lng: 46.2738, zoom: 8, radiusKm: 130 },
  " ": { name: " ", lat: 37.5527, lng: 45.0761, zoom: 8, radiusKm: 140 },
  : { name: "", lat: 31.3183, lng: 48.6706, zoom: 8, radiusKm: 160 },
  : { name: "", lat: 37.2808, lng: 49.5832, zoom: 9, radiusKm: 80 },
  : { name: "", lat: 36.5659, lng: 53.06, zoom: 8, radiusKm: 130 },
  : { name: "", lat: 30.2839, lng: 57.0834, zoom: 7, radiusKm: 250 },
  : { name: "", lat: 34.6416, lng: 50.8746, zoom: 10, radiusKm: 50 },
  : { name: "", lat: 31.8974, lng: 54.3569, zoom: 8, radiusKm: 170 },
  : { name: "", lat: 34.7992, lng: 48.5146, zoom: 9, radiusKm: 90 },
  : { name: "", lat: 34.3142, lng: 47.065, zoom: 9, radiusKm: 100 },
  : { name: "", lat: 36.8427, lng: 54.4342, zoom: 9, radiusKm: 90 },
  : { name: "", lat: 38.2498, lng: 48.2933, zoom: 9, radiusKm: 90 },
  : { name: "", lat: 36.2688, lng: 50.0041, zoom: 9, radiusKm: 70 },
  : { name: "", lat: 36.6736, lng: 48.4787, zoom: 9, radiusKm: 90 },
  : { name: "", lat: 34.0917, lng: 49.6892, zoom: 9, radiusKm: 100 },
  : { name: "", lat: 33.4878, lng: 48.3558, zoom: 9, radiusKm: 100 },
  : { name: "", lat: 35.3219, lng: 46.9862, zoom: 9, radiusKm: 100 },
  : { name: "", lat: 27.1832, lng: 56.2666, zoom: 8, radiusKm: 200 },
  : { name: "", lat: 28.9234, lng: 50.82, zoom: 8, radiusKm: 150 },
  : { name: "", lat: 35.5729, lng: 53.3971, zoom: 8, radiusKm: 180 },
  "  ": { name: "  ", lat: 29.4963, lng: 60.8629, zoom: 7, radiusKm: 300 },
  "  ": { name: "  ", lat: 32.3266, lng: 50.8644, zoom: 9, radiusKm: 80 },
  "  ": { name: "  ", lat: 30.6682, lng: 51.5876, zoom: 9, radiusKm: 80 },
  " ": { name: " ", lat: 37.4747, lng: 57.329, zoom: 8, radiusKm: 110 },
  " ": { name: " ", lat: 32.8649, lng: 59.2211, zoom: 7, radiusKm: 250 },
  : { name: "", lat: 33.6374, lng: 46.4227, zoom: 9, radiusKm: 90 },
};
/**    (   ) */
export const CITY_GEO: Record<string, GeoArea> = {
  : { name: "", lat: 35.6892, lng: 51.389, zoom: 11, radiusKm: 25 },
  : { name: "", lat: 36.2605, lng: 59.6168, zoom: 11, radiusKm: 20 },
  : { name: "", lat: 32.6546, lng: 51.668, zoom: 11, radiusKm: 18 },
  : { name: "", lat: 29.5918, lng: 52.5837, zoom: 11, radiusKm: 18 },
  : { name: "", lat: 38.0962, lng: 46.2738, zoom: 11, radiusKm: 16 },
  : { name: "", lat: 35.8327, lng: 50.9916, zoom: 11, radiusKm: 16 },
  : { name: "", lat: 31.3183, lng: 48.6706, zoom: 11, radiusKm: 16 },
  : { name: "", lat: 34.6416, lng: 50.8746, zoom: 11, radiusKm: 14 },
  : { name: "", lat: 34.3142, lng: 47.065, zoom: 11, radiusKm: 12 },
  : { name: "", lat: 37.2808, lng: 49.5832, zoom: 12, radiusKm: 10 },
  : { name: "", lat: 37.5527, lng: 45.0761, zoom: 12, radiusKm: 10 },
  : { name: "", lat: 30.2839, lng: 57.0834, zoom: 12, radiusKm: 12 },
  : { name: "", lat: 29.4963, lng: 60.8629, zoom: 12, radiusKm: 10 },
  : { name: "", lat: 31.8974, lng: 54.3569, zoom: 12, radiusKm: 10 },
  : { name: "", lat: 38.2498, lng: 48.2933, zoom: 12, radiusKm: 10 },
  : { name: "", lat: 27.1832, lng: 56.2666, zoom: 12, radiusKm: 10 },
  : { name: "", lat: 36.5659, lng: 53.06, zoom: 12, radiusKm: 10 },
  : { name: "", lat: 36.2688, lng: 50.0041, zoom: 12, radiusKm: 10 },
  : { name: "", lat: 36.6736, lng: 48.4787, zoom: 12, radiusKm: 10 },
  : { name: "", lat: 34.0917, lng: 49.6892, zoom: 12, radiusKm: 10 },
  "": { name: "", lat: 33.4878, lng: 48.3558, zoom: 12, radiusKm: 10 },
  : { name: "", lat: 35.3219, lng: 46.9862, zoom: 12, radiusKm: 10 },
  : { name: "", lat: 28.9234, lng: 50.82, zoom: 12, radiusKm: 10 },
  : { name: "", lat: 36.8427, lng: 54.4342, zoom: 12, radiusKm: 10 },
  : { name: "", lat: 34.7992, lng: 48.5146, zoom: 12, radiusKm: 10 },
  : { name: "", lat: 32.3266, lng: 50.8644, zoom: 12, radiusKm: 10 },
  : { name: "", lat: 37.4747, lng: 57.329, zoom: 12, radiusKm: 10 },
  : { name: "", lat: 32.8649, lng: 59.2211, zoom: 12, radiusKm: 10 },

  : { name: "", lat: 33.6374, lng: 46.4227, zoom: 12, radiusKm: 10 },
  : { name: "", lat: 30.6682, lng: 51.5876, zoom: 12, radiusKm: 10 },
  : { name: "", lat: 35.5729, lng: 53.3971, zoom: 12, radiusKm: 10 },
};
/**       */
export const TEHRAN_REGIONS: Record<string, GeoArea> = {
  " 1": { name: " ", lat: 35.8046, lng: 51.4324, zoom: 13, radiusKm: 6 },
  " 2": { name: " ", lat: 35.7576, lng: 51.3347, zoom: 13, radiusKm: 6 },
  " 3": { name: " ", lat: 35.7647, lng: 51.4059, zoom: 13, radiusKm: 5 },
  " 4": { name: " ", lat: 35.7614, lng: 51.5108, zoom: 13, radiusKm: 7 },
  " 5": { name: " ", lat: 35.7576, lng: 51.3018, zoom: 13, radiusKm: 6 },
  " 6": { name: " ", lat: 35.7219, lng: 51.4089, zoom: 13, radiusKm: 4 },
  " 7": { name: " ", lat: 35.7315, lng: 51.4462, zoom: 13, radiusKm: 4 },
  " 8": { name: " ", lat: 35.7275, lng: 51.4869, zoom: 13, radiusKm: 4 },
  " 9": { name: " ", lat: 35.6959, lng: 51.3162, zoom: 13, radiusKm: 4 },
  " 10": { name: " ", lat: 35.6892, lng: 51.3565, zoom: 13, radiusKm: 4 },
  " 11": { name: " ", lat: 35.6875, lng: 51.3889, zoom: 13, radiusKm: 4 },
  " 12": { name: " ", lat: 35.6836, lng: 51.4275, zoom: 13, radiusKm: 4 },
  " 13": { name: " ", lat: 35.7008, lng: 51.4831, zoom: 13, radiusKm: 4 },
  " 14": { name: " ", lat: 35.6708, lng: 51.4675, zoom: 13, radiusKm: 5 },
  " 15": { name: " ", lat: 35.6459, lng: 51.4675, zoom: 13, radiusKm: 6 },
  " 16": { name: " ", lat: 35.6398, lng: 51.4008, zoom: 13, radiusKm: 4 },
  " 17": { name: " ", lat: 35.6553, lng: 51.3555, zoom: 13, radiusKm: 4 },
  " 18": { name: " ", lat: 35.6553, lng: 51.3018, zoom: 13, radiusKm: 6 },
  " 19": { name: " ", lat: 35.6252, lng: 51.3555, zoom: 13, radiusKm: 5 },
  " 20": { name: " ", lat: 35.5892, lng: 51.4324, zoom: 13, radiusKm: 6 },
  " 21": { name: " ", lat: 35.6959, lng: 51.2261, zoom: 13, radiusKm: 7 },
  " 22": { name: " ", lat: 35.7576, lng: 51.2072, zoom: 13, radiusKm: 8 },
};
/**       */
function norm(s: string) {
  return String(s ?? "")
    .replace(/[\u200c\u200f\u200e]/g, "")
    .replace(/[]/g, "")
    .replace(//g, "")
    .replace(/\s+/g, " ")
    .trim();
}
/**      ( « ») */
function toEn(s: string) {
  return s.replace(/[\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) - 0x06f0));
}
/**
 *       /  / .
 *      ( ←  ←  ← ).
 */
export function resolveArea(province?: string, city?: string, region?: string): GeoArea {
  const r = toEn(norm(region ?? ""));
  const c = norm(city ?? "");
  const p = norm(province ?? "");
  if (c === "" && r && TEHRAN_REGIONS[r]) return TEHRAN_REGIONS[r];
  if (c && CITY_GEO[c]) return CITY_GEO[c];
  if (p && PROVINCE_GEO[p]) return PROVINCE_GEO[p];
  return IRAN_CENTER;
}
/**       */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
/**       */
export function provinceOf(point: { lat: number; lng: number }): string {
  let best = "";
  let bestD = Number.POSITIVE_INFINITY;
  for (const [name, g] of Object.entries(PROVINCE_GEO)) {
    const d = distanceKm(point, g);
    if (d < bestD) {
      bestD = d;
      best = name;
    }
  }
  return best;
}

export const PROVINCE_NAMES = Object.keys(PROVINCE_GEO);
