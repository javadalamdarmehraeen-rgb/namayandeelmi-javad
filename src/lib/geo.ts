/**
 * مختصات و شعاع تقریبی استان‌ها، شهرهای اصلی و مناطق شهرداری.
 * برای زوم خودکار نقشه و ترسیم محدوده استفاده می‌شود.
 */

export type GeoArea = { lat: number; lng: number; radiusM: number };

/** مرکز و شعاع تقریبی هر استان */
export const PROVINCE_GEO: Record<string, GeoArea> = {
  تهران: { lat: 35.6892, lng: 51.389, radiusM: 60000 },
  البرز: { lat: 35.8327, lng: 50.9915, radiusM: 35000 },
  اصفهان: { lat: 32.6546, lng: 51.668, radiusM: 130000 },
  فارس: { lat: 29.5918, lng: 52.5837, radiusM: 150000 },
  "خراسان رضوی": { lat: 36.2605, lng: 59.6168, radiusM: 160000 },
  "آذربایجان شرقی": { lat: 38.0962, lng: 46.2738, radiusM: 110000 },
  "آذربایجان غربی": { lat: 37.5527, lng: 45.0761, radiusM: 120000 },
  خوزستان: { lat: 31.3183, lng: 48.6706, radiusM: 130000 },
  گیلان: { lat: 37.2808, lng: 49.5832, radiusM: 70000 },
  مازندران: { lat: 36.5659, lng: 53.06, radiusM: 110000 },
  کرمان: { lat: 30.2839, lng: 57.0834, radiusM: 190000 },
  قم: { lat: 34.6416, lng: 50.8746, radiusM: 45000 },
  یزد: { lat: 31.8974, lng: 54.3569, radiusM: 130000 },
  همدان: { lat: 34.7992, lng: 48.5146, radiusM: 70000 },
  کرمانشاه: { lat: 34.3277, lng: 47.0778, radiusM: 90000 },
  گلستان: { lat: 36.8427, lng: 54.4344, radiusM: 70000 },
  اردبیل: { lat: 38.2498, lng: 48.2933, radiusM: 70000 },
  قزوین: { lat: 36.2688, lng: 50.0041, radiusM: 55000 },
  زنجان: { lat: 36.6736, lng: 48.4787, radiusM: 65000 },
  مرکزی: { lat: 34.0917, lng: 49.6892, radiusM: 80000 },
  لرستان: { lat: 33.4878, lng: 48.3558, radiusM: 80000 },
  کردستان: { lat: 35.3117, lng: 46.9975, radiusM: 85000 },
  هرمزگان: { lat: 27.1832, lng: 56.2666, radiusM: 160000 },
  بوشهر: { lat: 28.9234, lng: 50.82, radiusM: 130000 },
  سمنان: { lat: 35.5769, lng: 53.3958, radiusM: 130000 },
  "سیستان و بلوچستان": { lat: 29.4963, lng: 60.8629, radiusM: 220000 },
  "چهارمحال و بختیاری": { lat: 32.3266, lng: 50.8644, radiusM: 60000 },
  "کهگیلویه و بویراحمد": { lat: 30.6682, lng: 51.5875, radiusM: 60000 },
  "خراسان شمالی": { lat: 37.4747, lng: 57.3299, radiusM: 80000 },
  "خراسان جنوبی": { lat: 32.8649, lng: 59.2211, radiusM: 180000 },
  ایلام: { lat: 33.6374, lng: 46.4227, radiusM: 70000 },
};

/** مختصات شهرهای مهم (کلید: «استان|شهر» یا فقط نام شهر) */
export const CITY_GEO: Record<string, GeoArea> = {
  تهران: { lat: 35.6892, lng: 51.389, radiusM: 22000 },
  کرج: { lat: 35.8327, lng: 50.9915, radiusM: 12000 },
  مشهد: { lat: 36.2605, lng: 59.6168, radiusM: 18000 },
  اصفهان: { lat: 32.6546, lng: 51.668, radiusM: 15000 },
  شیراز: { lat: 29.5918, lng: 52.5837, radiusM: 14000 },
  تبریز: { lat: 38.0962, lng: 46.2738, radiusM: 13000 },
  اهواز: { lat: 31.3183, lng: 48.6706, radiusM: 13000 },
  قم: { lat: 34.6416, lng: 50.8746, radiusM: 11000 },
  کرمانشاه: { lat: 34.3277, lng: 47.0778, radiusM: 10000 },
  ارومیه: { lat: 37.5527, lng: 45.0761, radiusM: 10000 },
  رشت: { lat: 37.2808, lng: 49.5832, radiusM: 9000 },
  زاهدان: { lat: 29.4963, lng: 60.8629, radiusM: 10000 },
  کرمان: { lat: 30.2839, lng: 57.0834, radiusM: 10000 },
  همدان: { lat: 34.7992, lng: 48.5146, radiusM: 9000 },
  یزد: { lat: 31.8974, lng: 54.3569, radiusM: 9000 },
  اردبیل: { lat: 38.2498, lng: 48.2933, radiusM: 8000 },
  بندرعباس: { lat: 27.1832, lng: 56.2666, radiusM: 9000 },
  اراک: { lat: 34.0917, lng: 49.6892, radiusM: 8000 },
  قزوین: { lat: 36.2688, lng: 50.0041, radiusM: 8000 },
  زنجان: { lat: 36.6736, lng: 48.4787, radiusM: 8000 },
  ساری: { lat: 36.5659, lng: 53.06, radiusM: 7000 },
  گرگان: { lat: 36.8427, lng: 54.4344, radiusM: 7000 },
  سنندج: { lat: 35.3117, lng: 46.9975, radiusM: 7000 },
  بوشهر: { lat: 28.9234, lng: 50.82, radiusM: 7000 },
  خرم‌آباد: { lat: 33.4878, lng: 48.3558, radiusM: 7000 },
  شهرکرد: { lat: 32.3266, lng: 50.8644, radiusM: 6000 },
  بجنورد: { lat: 37.4747, lng: 57.3299, radiusM: 6000 },
  بیرجند: { lat: 32.8649, lng: 59.2211, radiusM: 6000 },
  ایلام: { lat: 33.6374, lng: 46.4227, radiusM: 6000 },
  یاسوج: { lat: 30.6682, lng: 51.5875, radiusM: 6000 },
  سمنان: { lat: 35.5769, lng: 53.3958, radiusM: 6000 },
  اسلامشهر: { lat: 35.5442, lng: 51.2306, radiusM: 6000 },
  شهریار: { lat: 35.6606, lng: 51.0578, radiusM: 6000 },
  ری: { lat: 35.5928, lng: 51.4344, radiusM: 6000 },
  ورامین: { lat: 35.3242, lng: 51.6459, radiusM: 5000 },
  پاکدشت: { lat: 35.4794, lng: 51.6839, radiusM: 5000 },
  قدس: { lat: 35.7215, lng: 51.1094, radiusM: 5000 },
  ملارد: { lat: 35.6658, lng: 50.9767, radiusM: 5000 },
  فردیس: { lat: 35.7269, lng: 50.9714, radiusM: 5000 },
  کاشان: { lat: 33.9831, lng: 51.4364, radiusM: 7000 },
  نجف‌آباد: { lat: 32.6342, lng: 51.3667, radiusM: 6000 },
  "خمینی‌شهر": { lat: 32.6858, lng: 51.5211, radiusM: 5000 },
  "شاهین‌شهر": { lat: 32.8656, lng: 51.5525, radiusM: 5000 },
  نیشابور: { lat: 36.2133, lng: 58.7958, radiusM: 7000 },
  سبزوار: { lat: 36.2126, lng: 57.6819, radiusM: 6000 },
  مرودشت: { lat: 29.8742, lng: 52.8025, radiusM: 6000 },
  کازرون: { lat: 29.6194, lng: 51.6541, radiusM: 5000 },
  آبادان: { lat: 30.3392, lng: 48.3043, radiusM: 8000 },
  خرمشهر: { lat: 30.4397, lng: 48.1664, radiusM: 6000 },
  دزفول: { lat: 32.3831, lng: 48.4058, radiusM: 7000 },
  "بندر انزلی": { lat: 37.4722, lng: 49.4622, radiusM: 6000 },
  لاهیجان: { lat: 37.2077, lng: 50.0041, radiusM: 5000 },
  بابل: { lat: 36.5513, lng: 52.6789, radiusM: 6000 },
  آمل: { lat: 36.4696, lng: 52.3507, radiusM: 6000 },
  "قائم‌شهر": { lat: 36.4631, lng: 52.86, radiusM: 5000 },
  چالوس: { lat: 36.655, lng: 51.4204, radiusM: 5000 },
  رفسنجان: { lat: 30.4067, lng: 55.9939, radiusM: 6000 },
  سیرجان: { lat: 29.4519, lng: 55.6814, radiusM: 6000 },
  بم: { lat: 29.106, lng: 58.357, radiusM: 5000 },
  میبد: { lat: 32.2126, lng: 54.0166, radiusM: 5000 },
  اردکان: { lat: 32.31, lng: 54.0175, radiusM: 5000 },
  ملایر: { lat: 34.2969, lng: 48.8236, radiusM: 5000 },
  مراغه: { lat: 37.3833, lng: 46.2361, radiusM: 5000 },
  مرند: { lat: 38.4328, lng: 45.7739, radiusM: 5000 },
  خوی: { lat: 38.5503, lng: 44.9522, radiusM: 5000 },
  مهاباد: { lat: 36.7631, lng: 45.7222, radiusM: 5000 },
  بوکان: { lat: 36.5211, lng: 46.2089, radiusM: 5000 },
  ساوه: { lat: 35.0213, lng: 50.3566, radiusM: 5000 },
  بروجرد: { lat: 33.8973, lng: 48.7516, radiusM: 5000 },
  سقز: { lat: 36.2497, lng: 46.2735, radiusM: 5000 },
  مریوان: { lat: 35.5219, lng: 46.1758, radiusM: 5000 },
  قشم: { lat: 26.9581, lng: 56.2719, radiusM: 8000 },
  کیش: { lat: 26.5578, lng: 53.9807, radiusM: 6000 },
  چابهار: { lat: 25.2919, lng: 60.643, radiusM: 7000 },
  زابل: { lat: 31.0286, lng: 61.5011, radiusM: 6000 },
  ایرانشهر: { lat: 27.2025, lng: 60.6848, radiusM: 6000 },
  شاهرود: { lat: 36.4181, lng: 54.9764, radiusM: 6000 },
  "گنبد کاووس": { lat: 37.25, lng: 55.1672, radiusM: 6000 },
  "پارس‌آباد": { lat: 39.6482, lng: 47.9174, radiusM: 5000 },
  ابهر: { lat: 36.1469, lng: 49.2181, radiusM: 5000 },
  تاکستان: { lat: 36.0697, lng: 49.6961, radiusM: 5000 },
  دورود: { lat: 33.4949, lng: 49.0589, radiusM: 4000 },
  بروجن: { lat: 31.9653, lng: 51.2872, radiusM: 4000 },
  "دوگنبدان": { lat: 30.3586, lng: 50.7981, radiusM: 4000 },
  اسفراین: { lat: 37.0764, lng: 57.51, radiusM: 4000 },
  قائن: { lat: 33.7264, lng: 59.1839, radiusM: 4000 },
  دهلران: { lat: 32.6942, lng: 47.2678, radiusM: 4000 },
  گراش: { lat: 27.6636, lng: 54.1394, radiusM: 4000 },
  جهرم: { lat: 28.5, lng: 53.5606, radiusM: 5000 },
  فسا: { lat: 28.9383, lng: 53.6482, radiusM: 5000 },
  لار: { lat: 27.6817, lng: 54.3341, radiusM: 5000 },
  گناوه: { lat: 29.5794, lng: 50.5158, radiusM: 4000 },
  برازجان: { lat: 29.2669, lng: 51.2183, radiusM: 4000 },
  میناب: { lat: 27.1467, lng: 57.08, radiusM: 4000 },
};

/**
 * مناطق شهرداری تهران — مرکز تقریبی هر منطقه.
 * برای شهرهای دیگر، مناطق حول مرکز شهر توزیع می‌شوند.
 */
export const TEHRAN_REGIONS: Record<string, GeoArea> = {
  "منطقه 1": { lat: 35.8046, lng: 51.4344, radiusM: 4500 },
  "منطقه 2": { lat: 35.7575, lng: 51.3347, radiusM: 4000 },
  "منطقه 3": { lat: 35.7669, lng: 51.4247, radiusM: 3500 },
  "منطقه 4": { lat: 35.7594, lng: 51.5147, radiusM: 5000 },
  "منطقه 5": { lat: 35.7519, lng: 51.2711, radiusM: 4500 },
  "منطقه 6": { lat: 35.7248, lng: 51.4053, radiusM: 3000 },
  "منطقه 7": { lat: 35.7286, lng: 51.4489, radiusM: 2500 },
  "منطقه 8": { lat: 35.7292, lng: 51.4939, radiusM: 3000 },
  "منطقه 9": { lat: 35.6942, lng: 51.3197, radiusM: 2500 },
  "منطقه 10": { lat: 35.6928, lng: 51.3625, radiusM: 2500 },
  "منطقه 11": { lat: 35.6825, lng: 51.3894, radiusM: 2500 },
  "منطقه 12": { lat: 35.6828, lng: 51.4283, radiusM: 2500 },
  "منطقه 13": { lat: 35.7011, lng: 51.4842, radiusM: 3000 },
  "منطقه 14": { lat: 35.6708, lng: 51.4711, radiusM: 3000 },
  "منطقه 15": { lat: 35.6392, lng: 51.4783, radiusM: 4000 },
  "منطقه 16": { lat: 35.6408, lng: 51.4083, radiusM: 3000 },
  "منطقه 17": { lat: 35.6564, lng: 51.3611, radiusM: 2500 },
  "منطقه 18": { lat: 35.6494, lng: 51.3033, radiusM: 4000 },
  "منطقه 19": { lat: 35.6231, lng: 51.3547, radiusM: 3500 },
  "منطقه 20": { lat: 35.5928, lng: 51.4344, radiusM: 4500 },
  "منطقه 21": { lat: 35.6947, lng: 51.2258, radiusM: 5000 },
  "منطقه 22": { lat: 35.7444, lng: 51.1961, radiusM: 6000 },
};

/** مرکز تقریبی ایران برای نمای کلی */
export const IRAN_CENTER: GeoArea = { lat: 32.4279, lng: 53.688, radiusM: 900000 };

export function provinceArea(name: string): GeoArea | null {
  return PROVINCE_GEO[name] ?? null;
}

export function cityArea(city: string, province?: string): GeoArea | null {
  if (CITY_GEO[city]) return CITY_GEO[city];
  // اگر شهر در فهرست نبود، مرکز استان استفاده می‌شود
  return province ? (PROVINCE_GEO[province] ?? null) : null;
}

/**
 * محدوده یک منطقه شهرداری.
 * تهران داده دقیق دارد؛ برای بقیه شهرها مناطق حول مرکز شهر چیده می‌شوند.
 */
export function regionArea(region: string, city: string, province?: string): GeoArea | null {
  if (city === "تهران" && TEHRAN_REGIONS[region]) return TEHRAN_REGIONS[region];
  const base = cityArea(city, province);
  if (!base) return null;
  const n = Number(String(region).replace(/\D/g, "")) || 1;
  // توزیع دایره‌ای مناطق حول مرکز شهر
  const angle = ((n - 1) * 2 * Math.PI) / 8;
  const dist = base.radiusM * 0.45;
  const dLat = (dist * Math.cos(angle)) / 111000;
  const dLng = (dist * Math.sin(angle)) / (111000 * Math.cos((base.lat * Math.PI) / 180));
  return { lat: base.lat + dLat, lng: base.lng + dLng, radiusM: Math.max(1500, base.radiusM / 4) };
}

/** بهترین محدوده بر اساس انتخاب کاربر */
export function resolveArea(province?: string, city?: string, region?: string): GeoArea {
  if (region && city) {
    const r = regionArea(region, city, province);
    if (r) return r;
  }
  if (city) {
    const c = cityArea(city, province);
    if (c) return c;
  }
  if (province) {
    const p = provinceArea(province);
    if (p) return p;
  }
  return IRAN_CENTER;
}
