import { checkDatabase, dbInfo, hasDatabaseUrl } from "@/db";
import { ensureSeed } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Health check — با Retry داخلی و مهلت کوتاه.
 * برخلاف /ping این مسیر اتصال دیتابیس را هم بررسی می‌کند.
 */
export async function GET() {
  if (!hasDatabaseUrl) {
    return Response.json(
      { ok: false, db: false, reason: "DATABASE_URL تنظیم نشده است" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  const health = await checkDatabase();
  if (!health.ok) {
    return Response.json(
      { ok: false, db: false, latencyMs: health.latencyMs, reason: health.detail, pooler: dbInfo.usedPooler },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  // ساخت جدول‌ها / داده اولیه در پس‌زمینه؛ پاسخ health را معطل نمی‌کند
  void ensureSeed();

  return Response.json(
    {
      ok: true,
      db: true,
      latencyMs: health.latencyMs,
      pooler: dbInfo.usedPooler,
      connectTimeoutSec: dbInfo.connectTimeoutSec,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
