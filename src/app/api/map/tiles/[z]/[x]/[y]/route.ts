import { fetchWithRetry } from "@/lib/retry";
export const dynamic = "force-dynamic";
export const revalidate = 86400;
/**
 *       403   .
 *
 *     tile.openstreetmap.org    
 *      Route     User-Agent   
 *  .          .
 */
const SOURCES = [
  (z: number, x: number, y: number) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
  (z: number, x: number, y: number) => `https://a.tile.openstreetmap.fr/hot/${z}/${x}/${y}.png`,
  (z: number, x: number, y: number) => `https://basemaps.cartocdn.com/light_all/${z}/${x}/${y}.png`,
];
const TILE_HEADERS = {
  "User-Agent": "NdcoHub-SabtEtelaat/1.0 (https://ndcohub.ir; map tile proxy)",
  Accept: "image/avif,image/webp,image/png,image/*,*/*;q=0.8",
  Referer: "https://ndcohub.ir/",
};
/**  SVG       —   403/    */
function fallbackTile(z: number, x: number, y: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
    <rect width="256" height="256" fill="#eef2f1"/>
    <path d="M0 64h256M0 128h256M0 192h256M64 0v256M128 0v256M192 0v256" stroke="#d9e3e0" stroke-width="1"/>
    <path d="M0 180Q80 100 150 155T256 75" fill="none" stroke="#c2d6d0" stroke-width="5"/>
    <text x="128" y="224" text-anchor="middle" fill="#94a3b8" font-size="10" font-family="sans-serif">${z}/${x}/${y}</te
xt>
  </svg>`;
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
      "X-Map-Fallback": "1",
    },
  });
}
export async function GET(

  _req: Request,
  ctx: { params: Promise<{ z: string; x: string; y: string }> },
) {
  const { z: rz, x: rx, y: ry } = await ctx.params;
  const z = Number(rz);
  const x = Number(rx);
  const y = Number(ry.replace(/\.png$/i, ""));
  if (
    !Number.isInteger(z) ||
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    z < 1 ||
    z > 19 ||
    x < 0 ||
    y < 0 ||
    x >= 2 ** z ||
    y >= 2 ** z
  ) {
    return new Response("invalid tile", { status: 400 });
  }
  for (let i = 0; i < SOURCES.length; i++) {
    try {
      const res = await fetchWithRetry(
        SOURCES[i](z, x, y),
        { headers: TILE_HEADERS },
        { retries: 2, baseDelayMs: 250, maxDelayMs: 1200, timeoutMs: 9000, label: `tile-${i}` },
      );
      if (!res.ok) continue;
      const type = res.headers.get("content-type") ?? "";
      if (!type.startsWith("image/")) continue;
      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.length < 50) continue;
      return new Response(bytes, {
        headers: {
          "Content-Type": type,
          "Content-Length": String(bytes.length),
          "Cache-Control": "public, max-age=604800, stale-while-revalidate=2592000",
          "Access-Control-Allow-Origin": "*",
          "X-Map-Source": String(i + 1),
        },
      });
    } catch {
      //  
    }
  }
  return fallbackTile(z, x, y);
}
