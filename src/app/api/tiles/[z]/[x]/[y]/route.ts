import { fetchWithRetry } from "@/lib/retry";
export const dynamic = "force-dynamic";
/**
 *   OpenStreetMap. /Service Worker     
 *              .
 */
export async function GET(_req: Request, ctx: { params: Promise<{ z: string; x: string; y: string }> }) {
  const { z, x, y } = await ctx.params;
  if (!/^\d+$/.test(z) || !/^\d+$/.test(x) || !/^\d+$/.test(y)) return new Response("bad tile", { status: 400 });
  const zi = Number(z);
  if (zi < 0 || zi > 18) return new Response("bad zoom", { status: 400 });
  try {
    const sub = ["a", "b", "c"][(Number(x) + Number(y)) % 3];
    const res = await fetchWithRetry(`https://${sub}.tile.openstreetmap.org/${z}/${x}/${y}.png`, {
      headers: { "User-Agent": "SabtEtelaatKol/1.0 (offline map cache)" },
    }, { retries: 2, timeoutMs: 12000, label: "tile" });
    if (!res.ok) return new Response("tile unavailable", { status: res.status });
    const bytes = new Uint8Array(await res.arrayBuffer());
    return new Response(bytes, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=2592000, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    //  /      
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  }
}
