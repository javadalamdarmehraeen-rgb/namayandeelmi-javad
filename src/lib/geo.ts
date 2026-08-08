/**
 * ============================================================
 *  داده‌های جغرافیایی ایران برای نقشه
 * ------------------------------------------------------------
 *  مختصات مرکز و شعاع تقریبی هر استان، برای:
 *   • تمرکز نقشه روی استان/شهر انتخاب‌شده
 *   • تشخیص اینکه یک نقطه در کدام استان قرار دارد
 * ============================================================
 */

export type GeoArea = {
  /** نام استان یا شهر */
  name: string;
  lat: number;
  lng: number;
  /** بزرگ‌نمایی مناسب نقشه */
  zoom: number;
  /** شعاع تقریبی محدوده بر حسب کیلومتر */
  radiusKm: number;
};

/** مرکز جغرافیایی ایران — نقطه پیش‌فرض نقشه */
export const IRAN_CENTER: GeoArea = {
  name: "ایران",
  lat: 32.4279,
  lng: 53.688,
  zoom: 5,
  radiusKm: 900,
};

/** مرکز ۳۱ استان کشور */
export const PROVINCE_GEO: Record<string, GeoArea> = {
  تهران: { name: "تهران", lat: 35.6892, lng: 51.389, zoom: 10, radiusKm: 70 },
  البرز: { name: "البرز", lat: 35.8327, lng: 50.9916, zoom: 10, radiusKm: 45 },
  اصفهان: { name: "اصفهان", lat: 32.6546, lng: 51.668, zoom: 8, radiusKm: 180 },
  فارس: { name: "فارس", lat: 29.5918, lng: 52.5837, zoom: 8, radiusKm: 200 },
  "خراسان رضوی": { name: "خراسان رضوی", lat: 36.2605, lng: 59.6168, zoom: 8, radiusKm: 200 },
  "آذربایجان شرقی": { name: "آذربایجان شرقی", lat: 38.0962, lng: 46.2738, zoom: 8, radiusKm: 130 },
  "آذربایجان غربی": { name: "آذربایجان غربی", lat: 37.5527, lng: 45.0761, zoom: 8, radiusKm: 140 },
  خوزستان: { name: "خوزستان", lat: 31.3183, lng: 48.6706, zoom: 8, radiusKm: 160 },
  گیلان: { name: "گیلان", lat: 37.2808, lng: 49.5832, zoom: 9, radiusKm: 80 },
  مازندران: { name: "مازندران", lat: 36.5659, lng: 53.06, zoom: 8, radiusKm: 130 },
  کرمان: { name: "کرمان", lat: 30.2839, lng: 57.0834, zoom: 7, radiusKm: 250 },
  قم: { name: "قم", lat: 34.6416, lng: 50.8746, zoom: 10, radiusKm: 50 },
  یزد: { name: "یزد", lat: 31.8974, lng: 54.3569, zoom: 8, radiusKm: 170 },
  همدان: { name: "همدان", lat: 34.7992, lng: 48.5146, zoom: 9, radiusKm: 90 },
  کرمانشاه: { name: "کرمانشاه", lat: 34.3142, lng: 47.065, zoom: 9, radiusKm: 100 },
  گلستان: { name: "گلستان", lat: 36.8427, lng: 54.4342, zoom: 9, radiusKm: 90 },
  اردبیل: { name: "اردبیل", lat: 38.2498, lng: 48.2933, zoom: 9, radiusKm: 90 },
  قزوین: { name: "قزوین", lat: 36.2688, lng: 50.0041, zoom: 9, radiusKm: 70 },
  زنجان: { name: "زنجان", lat: 36.6736, lng: 48.4787, zoom: 9, radiusKm: 90 },
  مرکزی: { name: "مرکزی", lat: 34.0917, lng: 49.6892, zoom: 9, radiusKm: 100 },
  لرستان: { name: "لرستان", lat: 33.4878, lng: 48.3558, zoom: 9, radiusKm: 100 },
  کردستان: { name: "کردستان", lat: 35.3219, lng: 46.9862, zoom: 9, radiusKm: 100 },
  هرمزگان: { name: "هرمزگان", lat: 27.1832, lng: 56.2666, zoom: 8, radiusKm: 200 },
  بوشهر: { name: "بوشهر", lat: 28.9234, lng: 50.82, zoom: 8, radiusKm: 150 },
  سمنان: { name: "سمنان", lat: 35.5729, lng: 53.3971, zoom: 8, radiusKm: 180 },
  "سیستان و بلوچستان": { name: "سیستان و بلوچستان", lat: 29.4963, lng: 60.8629, zoom: 7, radiusKm: 300 },
  "چهارمحال و بختیاری": { name: "چهارمحال و بختیاری", lat: 32.3266, lng: 50.8644, zoom: 9, radiusKm: 80 },
  "کهگیلویه و بویراحمد": { name: "کهگیلویه و بویراحمد", lat: 30.6682, lng: 51.5876, zoom: 9, radiusKm: 80 },
  "خراسان شمالی": { name: "خراسان شمالی", lat: 37.4747, lng: 57.329, zoom: 8, radiusKm: 110 },
  "خراسان جنوبی": { name: "خراسان جنوبی", lat: 32.8649, lng: 59.2211, zoom: 7, radiusKm: 250 },
  ایلام: { name: "ایلام", lat: 33.6374, lng: 46.4227, zoom: 9, radiusKm: 90 },
};

/** مراکز شهرهای بزرگ (برای تمرکز دقیق‌تر نقشه) */
export const CITY_GEO: Record<string, GeoArea> = {
  تهران: { name: "تهران", lat: 35.6892, lng: 51.389, zoom: 11, radiusKm: 25 },
  مشهد: { name: "مشهد", lat: 36.2605, lng: 59.6168, zoom: 11, radiusKm: 20 },
  اصفهان: { name: "اصفهان", lat: 32.6546, lng: 51.668, zoom: 11, radiusKm: 18 },
  شیراز: { name: "شیراز", lat: 29.5918, lng: 52.5837, zoom: 11, radiusKm: 18 },
  تبریز: { name: "تبریز", lat: 38.0962, lng: 46.2738, zoom: 11, radiusKm: 16 },
  کرج: { name: "کرج", lat: 35.8327, lng: 50.9916, zoom: 11, radiusKm: 16 },
  اهواز: { name: "اهواز", lat: 31.3183, lng: 48.6706, zoom: 11, radiusKm: 16 },
  قم: { name: "قم", lat: 34.6416, lng: 50.8746, zoom: 11, radiusKm: 14 },
  کرمانشاه: { name: "کرمانشاه", lat: 34.3142, lng: 47.065, zoom: 11, radiusKm: 12 },
  رشت: { name: "رشت", lat: 37.2808, lng: 49.5832, zoom: 12, radiusKm: 10 },
  ارومیه: { name: "ارومیه", lat: 37.5527, lng: 45.0761, zoom: 12, radiusKm: 10 },
  کرمان: { name: "کرمان", lat: 30.2839, lng: 57.0834, zoom: 12, radiusKm: 12 },
  زاهدان: { name: "زاهدان", lat: 29.4963, lng: 60.8629, zoom: 12, radiusKm: 10 },
  یزد: { name: "یزد", lat: 31.8974, lng: 54.3569, zoom: 12, radiusKm: 10 },
  اردبیل: { name: "اردبیل", lat: 38.2498, lng: 48.2933, zoom: 12, radiusKm: 10 },
  بندرعباس: { name: "بندرعباس", lat: 27.1832, lng: 56.2666, zoom: 12, radiusKm: 10 },
  ساری: { name: "ساری", lat: 36.5659, lng: 53.06, zoom: 12, radiusKm: 10 },
  قزوین: { name: "قزوین", lat: 36.2688, lng: 50.0041, zoom: 12, radiusKm: 10 },
  زنجان: { name: "زنجان", lat: 36.6736, lng: 48.4787, zoom: 12, radiusKm: 10 },
  اراک: { name: "اراک", lat: 34.0917, lng: 49.6892, zoom: 12, radiusKm: 10 },
  "خرم‌آباد": { name: "خرم‌آباد", lat: 33.4878, lng: 48.3558, zoom: 12, radiusKm: 10 },
  سنندج: { name: "سنندج", lat: 35.3219, lng: 46.9862, zoom: 12, radiusKm: 10 },
  بوشهر: { name: "بوشهر", lat: 28.9234, lng: 50.82, zoom: 12, radiusKm: 10 },
  گرگان: { name: "گرگان", lat: 36.8427, lng: 54.4342, zoom: 12, radiusKm: 10 },
  همدان: { name: "همدان", lat: 34.7992, lng: 48.5146, zoom: 12, radiusKm: 10 },
  شهرکرد: { name: "شهرکرد", lat: 32.3266, lng: 50.8644, zoom: 12, radiusKm: 10 },
  بجنورد: { name: "بجنورد", lat: 37.4747, lng: 57.329, zoom: 12, radiusKm: 10 },
  بیرجند: { name: "بیرجند", lat: 32.8649, lng: 59.2211, zoom: 12, radiusKm: 10 },
  ایلام: { name: "ایلام", lat: 33.6374, lng: 46.4227, zoom: 12, radiusKm: 10 },
  یاسوج: { name: "یاسوج", lat: 30.6682, lng: 51.5876, zoom: 12, radiusKm: 10 },
  سمنان: { name: "سمنان", lat: 35.5729, lng: 53.3971, zoom: 12, radiusKm: 10 },
};

/** مراکز تقریبی مناطق ۲۲گانه شهرداری تهران */
export const TEHRAN_REGIONS: Record<string, GeoArea> = {
  "منطقه 1": { name: "منطقه ۱", lat: 35.8046, lng: 51.4324, zoom: 13, radiusKm: 6 },
  "منطقه 2": { name: "منطقه ۲", lat: 35.7576, lng: 51.3347, zoom: 13, radiusKm: 6 },
  "منطقه 3": { name: "منطقه ۳", lat: 35.7647, lng: 51.4059, zoom: 13, radiusKm: 5 },
  "منطقه 4": { name: "منطقه ۴", lat: 35.7614, lng: 51.5108, zoom: 13, radiusKm: 7 },
  "منطقه 5": { name: "منطقه ۵", lat: 35.7576, lng: 51.3018, zoom: 13, radiusKm: 6 },
  "منطقه 6": { name: "منطقه ۶", lat: 35.7219, lng: 51.4089, zoom: 13, radiusKm: 4 },
  "منطقه 7": { name: "منطقه ۷", lat: 35.7315, lng: 51.4462, zoom: 13, radiusKm: 4 },
  "منطقه 8": { name: "منطقه ۸", lat: 35.7275, lng: 51.4869, zoom: 13, radiusKm: 4 },
  "منطقه 9": { name: "منطقه ۹", lat: 35.6959, lng: 51.3162, zoom: 13, radiusKm: 4 },
  "منطقه 10": { name: "منطقه ۱۰", lat: 35.6892, lng: 51.3565, zoom: 13, radiusKm: 4 },
  "منطقه 11": { name: "منطقه ۱۱", lat: 35.6875, lng: 51.3889, zoom: 13, radiusKm: 4 },
  "منطقه 12": { name: "منطقه ۱۲", lat: 35.6836, lng: 51.4275, zoom: 13, radiusKm: 4 },
  "منطقه 13": { name: "منطقه ۱۳", lat: 35.7008, lng: 51.4831, zoom: 13, radiusKm: 4 },
  "منطقه 14": { name: "منطقه ۱۴", lat: 35.6708, lng: 51.4675, zoom: 13, radiusKm: 5 },
  "منطقه 15": { name: "منطقه ۱۵", lat: 35.6459, lng: 51.4675, zoom: 13, radiusKm: 6 },
  "منطقه 16": { name: "منطقه ۱۶", lat: 35.6398, lng: 51.4008, zoom: 13, radiusKm: 4 },
  "منطقه 17": { name: "منطقه ۱۷", lat: 35.6553, lng: 51.3555, zoom: 13, radiusKm: 4 },
  "منطقه 18": { name: "منطقه ۱۸", lat: 35.6553, lng: 51.3018, zoom: 13, radiusKm: 6 },
  "منطقه 19": { name: "منطقه ۱۹", lat: 35.6252, lng: 51.3555, zoom: 13, radiusKm: 5 },
  "منطقه 20": { name: "منطقه ۲۰", lat: 35.5892, lng: 51.4324, zoom: 13, radiusKm: 6 },
  "منطقه 21": { name: "منطقه ۲۱", lat: 35.6959, lng: 51.2261, zoom: 13, radiusKm: 7 },
  "منطقه 22": { name: "منطقه ۲۲", lat: 35.7576, lng: 51.2072, zoom: 13, radiusKm: 8 },
};

/** حذف نویز نگارشی برای تطبیق نام‌ها */
function norm(s: string) {
  return String(s ?? "")
    .replace(/[\u200c\u200f\u200e]/g, "")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim();
}

/** تبدیل ارقام فارسی به لاتین (برای «منطقه ۳») */
function toEn(s: string) {
  return s.replace(/[\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) - 0x06f0));
}

/**
 * یافتن محدوده نقشه بر اساس استان / شهر / منطقه.
 * دقیق‌ترین سطح موجود برگردانده می‌شود (منطقه ← شهر ← استان ← ایران).
 */
export function resolveArea(province?: string, city?: string, region?: string): GeoArea {
  const r = toEn(norm(region ?? ""));
  const c = norm(city ?? "");
  const p = norm(province ?? "");

  if (c === "تهران" && r && TEHRAN_REGIONS[r]) return TEHRAN_REGIONS[r];
  if (c && CITY_GEO[c]) return CITY_GEO[c];
  if (p && PROVINCE_GEO[p]) return PROVINCE_GEO[p];
  return IRAN_CENTER;
}

/** فاصله دو نقطه بر حسب کیلومتر */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** تشخیص استانِ نزدیک به یک نقطه */
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
