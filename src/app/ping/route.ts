/**
 *   /ping — Keep-Alive        .
 *
 *    (UptimeRobot BetterStack cron-job.org):
 *   URL      : https://<your-app>.onrender.com/ping
 *   Interval :   
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;
const startedAt = Date.now();
const HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "X-Robots-Tag": "noindex",
  "Access-Control-Allow-Origin": "*",
} as const;
export async function GET(req: Request) {
  if (!new URL(req.url).searchParams.has("json")) {
    return new Response("OK", { status: 200, headers: HEADERS });
  }
  return new Response(
    JSON.stringify({ status: "OK", uptimeMs: Date.now() - startedAt, timestamp: new Date().toISOString() }),
    { status: 200, headers: { ...HEADERS, "Content-Type": "application/json; charset=utf-8" } },
  );
}
export async function HEAD() {
  return new Response(null, { status: 200, headers: HEADERS });
}
