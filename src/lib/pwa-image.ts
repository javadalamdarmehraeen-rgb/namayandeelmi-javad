import { readFile } from "node:fs/promises";
import path from "node:path";
const PUB = path.join(process.cwd(), "public");
/**         */
const FALLBACK_LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="pill" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="#F9A03F"/><stop offset="35%" stop-color="#F7714B"/>
      <stop offset="70%" stop-color="#EC3B75"/><stop offset="100%" stop-color="#C81E63"/>
    </linearGradient>
    <linearGradient id="glossTop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity=".45"/>
      <stop offset="55%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <g transform="translate(256 256) rotate(-45)">
    <rect x="-168" y="-84" width="336" height="168" rx="84" ry="84" fill="url(#pill)"/>

    <line x1="0" y1="-84" x2="0" y2="84" stroke="#ffffff" stroke-opacity=".35" stroke-width="6"/>
    <rect x="-160" y="-76" width="320" height="80" rx="40" ry="40" fill="url(#glossTop)"/>
    <circle cx="104" cy="-30" r="18" fill="#ffffff" fill-opacity=".92"/>
  </g>
</svg>`;
const cache = new Map<string, Uint8Array>();
async function loadSvg(rel: string, fallback: string) {
  try {
    return await readFile(path.join(PUB, rel), "utf8");
  } catch {
    return fallback;
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getSharp(): Promise<any | null> {
  try {
    const mod = await import("sharp");
    return mod.default;
  } catch {
    return null;
  }
}
const plate = (size: number) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#eef2f6"/></linearGradient></defs>
      <rect width="${size}" height="${size}" fill="url(#g)"/></svg>`,
  );
/**   PNG   (    ) */
export async function renderIcon(size: number, maskable = false): Promise<Uint8Array | null> {
  const key = `${maskable ? "m" : "i"}-${size}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const sharp = await getSharp();
  const svg = await loadSvg("logo.svg", FALLBACK_LOGO);
  if (!sharp) return null;
  let out: Buffer;
  if (maskable) {
    const inner = await sharp(Buffer.from(svg), { density: 500 })
      .resize(Math.round(size * 0.62), Math.round(size * 0.62))
      .png()
      .toBuffer();
    out = await sharp(plate(size)).composite([{ input: inner, gravity: "center" }]).png().toBuffer();
  } else {
    out = await sharp(Buffer.from(svg), { density: 500 })
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
  }
  const bytes = new Uint8Array(out);
  cache.set(key, bytes);
  return bytes;
}
/**   PNG   */
export async function renderScreenshot(name: string): Promise<Uint8Array | null> {
  const hit = cache.get(`s-${name}`);
  if (hit) return hit;
  const sharp = await getSharp();
  if (!sharp) return null;
  const svg = await loadSvg(`src-svg/${name}.svg`, "");
  if (!svg) return null;
  const out = await sharp(Buffer.from(svg)).png().toBuffer();
  const bytes = new Uint8Array(out);
  cache.set(`s-${name}`, bytes);
  return bytes;
}
export function pngResponse(bytes: Uint8Array) {
  return new Response(bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });

}
