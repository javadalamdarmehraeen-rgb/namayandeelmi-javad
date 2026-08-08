/**
 * ============================================================
 *  پیکربندی همگام‌سازی دوسروره
 *  Render (namayandeelmi-javad.onrender.com) ↔ NdcoHub.ir
 * ------------------------------------------------------------
 *  هر رکورد سه ستون کمکی دارد:
 *    uid        → شناسه سراسری یکتا (UUID) تا شناسه عددی دو سرور تداخل نکند
 *    updated_at → زمان آخرین تغییر (توسط تریگر خودکار به‌روز می‌شود)
 *    origin     → نام سروری که رکورد در آن ساخته شده
 *
 *  الگوریتم: Last-Write-Wins بر اساس updated_at
 * ============================================================
 */

export type SyncTable = {
  /** نام جدول در دیتابیس */
  name: string;
  /** عنوان فارسی برای نمایش */
  label: string;
  /** ستون‌هایی که نباید همگام شوند (شناسه محلی) */
  skipColumns?: string[];
  /** پیش‌فرض فعال باشد؟ (جدول‌های حجیم پیش‌فرض خاموش‌اند) */
  defaultOn: boolean;
  /** سقف رکورد در هر بار همگام‌سازی */
  batch: number;
};

export const SYNC_TABLES: SyncTable[] = [
  { name: "users", label: "کاربران", defaultOn: true, batch: 500 },
  { name: "roles", label: "سمت‌ها", defaultOn: true, batch: 200 },
  { name: "options", label: "لیست‌های کشویی", defaultOn: true, batch: 2000 },
  { name: "settings", label: "تنظیمات", defaultOn: true, batch: 200 },
  { name: "pharmacies", label: "داروخانه‌ها", defaultOn: true, batch: 1000 },
  { name: "doctors", label: "پزشکان", defaultOn: true, batch: 1000 },
  { name: "orders", label: "سفارشات", defaultOn: true, batch: 1000 },
  { name: "targets", label: "تارگت فروش", defaultOn: true, batch: 500 },
  { name: "homes", label: "لوکیشن منزل", defaultOn: true, batch: 500 },
  { name: "leaves", label: "مرخصی‌ها", defaultOn: true, batch: 500 },
  { name: "messengers", label: "پیام‌رسان‌ها", defaultOn: true, batch: 200 },
  { name: "notifications", label: "اعلان‌ها", defaultOn: true, batch: 500 },
  { name: "activity_logs", label: "گزارش فعالیت", defaultOn: false, batch: 500 },
  { name: "trips", label: "سفرهای ویزیت", defaultOn: true, batch: 500 },
  { name: "trip_points", label: "نقاط مسیر", defaultOn: false, batch: 2000 },
  { name: "attachments", label: "فایل‌ها و تصاویر", defaultOn: false, batch: 20 },
];

/** ستون‌هایی که هرگز از همتا کپی نمی‌شوند (محلی هستند) */
export const LOCAL_ONLY_COLUMNS = new Set(["id"]);

/** نام این سرور — در Render و NdcoHub متفاوت تنظیم می‌شود */
export function nodeName(): string {
  return (
    process.env.NODE_NAME ||
    process.env.SYNC_NODE_NAME ||
    (process.env.RENDER ? "render" : "") ||
    (process.env.VERCEL ? "vercel" : "") ||
    "primary"
  );
}

/** آدرس عمومی این سرور */
export function selfUrl(): string {
  return (
    process.env.PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.RENDER_EXTERNAL_URL ?? "") ||
    ""
  );
}

/** فهرست سرورهای همتا از متغیر محیطی: name|url,name|url */
export function configuredPeers(): { peer: string; url: string }[] {
  const raw = process.env.SYNC_PEERS || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const [peer, url] = entry.split("|").map((x) => x.trim());
      return { peer: peer || "peer", url: url || peer };
    })
    .filter((p) => p.url.startsWith("http"));
}

/** کلید مشترک بین دو سرور برای احراز هویت درخواست‌های همگام‌سازی */
export function syncSecret(): string {
  return process.env.SYNC_SECRET || process.env.APP_SECRET || "";
}

/** آدرس‌های عمومی برنامه که کلاینت بین آن‌ها جابه‌جا می‌شود */
export const PUBLIC_ENDPOINTS: string[] = (
  process.env.NEXT_PUBLIC_ENDPOINTS || "https://ndcohub.ir,https://namayandeelmi-javad.onrender.com"
)
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);
