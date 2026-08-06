/**
 * Keep-Alive endpoint — بدون احراز هویت و بدون تماس با دیتابیس.
 *
 * هدف: جلوگیری از خوابیدن سرویس روی Render (نسخه رایگان پس از ۱۵ دقیقه
 * بی‌کاری خاموش می‌شود و بیدار شدن مجدد تا ۵۰ ثانیه طول می‌کشد).
 *
 * در UptimeRobot یک مانیتور از نوع HTTP(s) بسازید:
 *   URL      : https://<your-app>.onrender.com/ping
 *   Interval : هر ۵ دقیقه
 *
 * مسیرهای معادل: /ping و /api/ping
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

const startedAt = Date.now();

const headers = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "X-Robots-Tag": "noindex",
  "Access-Control-Allow-Origin": "*",
} as const;

export async function GET(req: Request) {
  // حالت ساده برای سرویس‌های مانیتورینگ: فقط متن OK
  const wantsJson = new URL(req.url).searchParams.has("json");
  if (!wantsJson) return new Response("OK", { status: 200, headers });

  return new Response(
    JSON.stringify({
      status: "OK",
      uptimeMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    }),
    { status: 200, headers: { ...headers, "Content-Type": "application/json; charset=utf-8" } },
  );
}

export async function HEAD() {
  return new Response(null, { status: 200, headers });
}
