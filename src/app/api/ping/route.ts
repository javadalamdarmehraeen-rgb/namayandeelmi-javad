/**
 * Keep-Alive endpoint —        .
 *
 * :      Render (     
 *            ).
 *
 *  UptimeRobot     HTTP(s) :
 *   URL      : https://<your-app>.onrender.com/ping
 *   Interval :   
 *
 *  : /ping  /api/ping
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
  //     :   OK
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
