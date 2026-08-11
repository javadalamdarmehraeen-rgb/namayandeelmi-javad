#!/usr/bin/env node
/**
 *      PWA    SVG.
 *
 *     PNG      /  
 *    PWABuilder  «Fix the links to your icons» .
 *      build         
 *      .
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
const ROOT = process.cwd();
const PUB = path.join(ROOT, "public");
const ICONS = path.join(PUB, "icons");
const SHOTS = path.join(PUB, "screenshots");
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="pill" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="#F9A03F"/>
      <stop offset="35%" stop-color="#F7714B"/>
      <stop offset="70%" stop-color="#EC3B75"/>
      <stop offset="100%" stop-color="#C81E63"/>
    </linearGradient>
    <linearGradient id="glossTop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity=".45"/>
      <stop offset="55%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#8b1141" flood-opacity=".28"/>
    </filter>
  </defs>
  <g transform="translate(256 256) rotate(-45)" filter="url(#soft)">
    <rect x="-168" y="-84" width="336" height="168" rx="84" ry="84" fill="url(#pill)"/>

    <line x1="0" y1="-84" x2="0" y2="84" stroke="#ffffff" stroke-opacity=".35" stroke-width="6"/>
    <rect x="-160" y="-76" width="320" height="80" rx="40" ry="40" fill="url(#glossTop)"/>
    <circle cx="104" cy="-30" r="18" fill="#ffffff" fill-opacity=".92"/>
    <circle cx="-96" cy="34" r="10" fill="#ffffff" fill-opacity=".28"/>
  </g>
</svg>`;
const F = "Tahoma, DejaVu Sans, sans-serif";
const card = (x, y, w, h, r = 18, fill = "#ffffff") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="#e2e8f0"/>`;
const tile = (x, y, w, icon, num, label, color) =>
  `<g>${card(x, y, w, 96)}<text x="${x + w / 2}" y="${y + 34}" font-size="22" text-anchor="middle" font-family="${F}">${
icon}</text>` +
  `<text x="${x + w / 2}" y="${y + 64}" font-size="24" font-weight="bold" fill="${color}" text-anchor="middle" font-fami
ly="${F}">${num}</text>` +
  `<text x="${x + w / 2}" y="${y + 84}" font-size="13" fill="#64748b" text-anchor="middle" font-family="${F}">${label}</
text></g>`;
const bars = (x, y, w, h, vals, color) => {
  const bw = w / vals.length - 10;
  return vals
    .map((v, i) => {
      const bh = Math.max(6, (v / Math.max(...vals)) * h);
      return `<rect x="${x + i * (bw + 10)}" y="${y + h - bh}" width="${bw}" height="${bh}" rx="5" fill="${color}" opaci
ty="${0.55 + (i / vals.length) * 0.45}"/>`;
    })
    .join("");
};
const header = (w, title) =>
  `<rect width="${w}" height="72" fill="#0f766e"/>` +
  `<text x="${w - 24}" y="34" font-size="19" font-weight="bold" fill="#ffffff" text-anchor="end" font-family="${F}"> 
 </text>` +
  `<text x="${w - 24}" y="56" font-size="13" fill="#c7f0ea" text-anchor="end" font-family="${F}">${title}</text>` +
  `<circle cx="42" cy="36" r="15" fill="#ffffff" opacity=".18"/>`;
const WIDE = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
<rect width="1280" height="720" fill="#f1f5f9"/>
${header(1280, "  —    ")}
${tile(40, 100, 190, "\u{1F3E5}", "", "", "#0f766e")}
${tile(248, 100, 190, "\u{1FA7A}", "", "", "#0369a1")}
${tile(456, 100, 190, "\u{1F9FE}", "", "", "#4f46e5")}
${tile(664, 100, 190, "\u{1F4CD}", "", " ", "#059669")}
${tile(872, 100, 190, "\u{1F4DD}", "", "", "#b45309")}
${tile(1080, 100, 160, "\u{1F464}", "", "", "#334155")}
${card(40, 220, 760, 300)}
<text x="770" y="252" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="end" font-family="${F}">  
  </text>
${bars(80, 280, 660, 200, [40, 62, 55, 88, 72, 96, 110, 85, 120, 100, 135, 148], "#0d9488")}
${card(820, 220, 420, 300)}
<text x="1210" y="252" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="end" font-family="${F}"> 
</text>
<g transform="translate(1030,390)">
  <circle r="78" fill="none" stroke="#0d9488" stroke-width="26" stroke-dasharray="180 490"/>
  <circle r="78" fill="none" stroke="#0ea5e9" stroke-width="26" stroke-dasharray="120 490" stroke-dashoffset="-180"/>
  <circle r="78" fill="none" stroke="#6366f1" stroke-width="26" stroke-dasharray="95 490" stroke-dashoffset="-300"/>
  <circle r="78" fill="none" stroke="#f59e0b" stroke-width="26" stroke-dasharray="95 490" stroke-dashoffset="-395"/>
  <text y="8" font-size="22" font-weight="bold" fill="#0f766e" text-anchor="middle" font-family="${F}"></text>
</g>
${card(40, 540, 1200, 150)}
<text x="1210" y="572" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="end" font-family="${F}"> 
 </text>
${[0, 1, 2]
  .map(
    (i) =>
      `<rect x="60" y="${590 + i * 32}" width="1160" height="26" rx="8" fill="#f8fafc"/>` +
      `<text x="1200" y="${608 + i * 32}" font-size="13" fill="#334155" text-anchor="end" font-family="${F}">${[" — ", " — ", " — "][i]}</text>`,
  )
  .join("")}
</svg>`;
const NARROW = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280">
<rect width="720" height="1280" fill="#f1f5f9"/>
${header(720, "  ")}
${card(24, 92, 672, 96)}
<text x="672" y="130" font-size="20" font-weight="bold" fill="#0f172a" text-anchor="end" font-family="${F}"> 
 </text>
<text x="672" y="162" font-size="14" fill="#64748b" text-anchor="end" font-family="${F}"> // —  
 </text>
<rect x="24" y="208" width="672" height="92" rx="18" fill="#0f766e"/>
<text x="668" y="248" font-size="19" font-weight="bold" fill="#ffffff" text-anchor="end" font-family="${F}">  
</text>
<text x="668" y="276" font-size="13" fill="#c7f0ea" text-anchor="end" font-family="${F}">  </text>
<rect x="24" y="312" width="672" height="92" rx="18" fill="#0369a1"/>
<text x="668" y="352" font-size="19" font-weight="bold" fill="#ffffff" text-anchor="end" font-family="${F}">  
</text>

<text x="668" y="380" font-size="13" fill="#cfe9fb" text-anchor="end" font-family="${F}">  </text>
<rect x="24" y="416" width="672" height="92" rx="18" fill="#4f46e5"/>
<text x="668" y="456" font-size="19" font-weight="bold" fill="#ffffff" text-anchor="end" font-family="${F}">  
</text>
<text x="668" y="484" font-size="13" fill="#d8d6fb" text-anchor="end" font-family="${F}">  </text>
${["", "", "", "", "", ""]
  .map((t, i) => {
    const x = 24 + (i % 3) * 228;
    const y = 528 + Math.floor(i / 3) * 116;
    return `${card(x, y, 208, 100)}<text x="${x + 104}" y="${y + 60}" font-size="16" font-weight="bold" fill="#334155" t
ext-anchor="middle" font-family="${F}">${t}</text>`;
  })
  .join("")}
${card(24, 772, 672, 300)}
<text x="668" y="806" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="end" font-family="${F}">  
  </text>
${bars(56, 830, 610, 210, [30, 48, 42, 70, 62, 88, 96, 78, 110, 96, 124, 140], "#0ea5e9")}
${card(24, 1092, 672, 92)}
<text x="668" y="1128" font-size="15" font-weight="bold" fill="#0f766e" text-anchor="end" font-family="${F}"> 
     </text>
<text x="668" y="1156" font-size="13" fill="#64748b" text-anchor="end" font-family="${F}">  +    G
PS</text>
<rect x="0" y="1208" width="720" height="72" fill="#0f766e"/>
<text x="360" y="1252" font-size="15" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="${F}"> 
  —     </text>
</svg>`;
const BRAND = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#0f766e"/><stop offset="100%" stop-color="#134e4a"/></linearGradient></defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <text x="640" y="560" font-size="46" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="${F}"> 
 </text>
  <text x="640" y="612" font-size="22" fill="#a7f3d0" text-anchor="middle" font-family="${F}">   — 
    </text>
</svg>`;
export const ICON_SIZES = [96, 128, 144, 152, 180, 192, 256, 384, 512, 1024];
const plate = (size) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#eef2f6"/>
      </linearGradient></defs>
      <rect width="${size}" height="${size}" fill="url(#g)"/>
    </svg>`,
  );
/**      */
export async function makeIcon(sharp, size) {
  return sharp(Buffer.from(LOGO_SVG), { density: 500 })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}
/**  maskable       */
export async function makeMaskable(sharp, size) {
  const inner = await sharp(Buffer.from(LOGO_SVG), { density: 500 })
    .resize(Math.round(size * 0.62), Math.round(size * 0.62))
    .png()
    .toBuffer();
  return sharp(plate(size)).composite([{ input: inner, gravity: "center" }]).png({ compressionLevel: 9 }).toBuffer();
}
export async function makeScreenshot(sharp, key) {
  if (key === "mobile-720x1280") return sharp(Buffer.from(NARROW)).png().toBuffer();
  if (key === "brand-1280x720") {
    const logo = await sharp(Buffer.from(LOGO_SVG), { density: 500 }).resize(300, 300).png().toBuffer();
    return sharp(Buffer.from(BRAND)).composite([{ input: logo, top: 140, left: 490 }]).png().toBuffer();
  }
  return sharp(Buffer.from(WIDE)).png().toBuffer();
}
export { LOGO_SVG };
async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.warn("  sharp          .");
    return;
  }

  mkdirSync(ICONS, { recursive: true });
  mkdirSync(SHOTS, { recursive: true });
  writeFileSync(path.join(PUB, "logo.svg"), LOGO_SVG);
  writeFileSync(path.join(PUB, "icon.svg"), LOGO_SVG);
  //  SVG ()  PNG       PNG
  //         .
  mkdirSync(path.join(PUB, "src-svg"), { recursive: true });
  writeFileSync(path.join(PUB, "src-svg", "desktop-1280x720.svg"), WIDE);
  writeFileSync(path.join(PUB, "src-svg", "mobile-720x1280.svg"), NARROW);
  writeFileSync(path.join(PUB, "src-svg", "brand-1280x720.svg"), BRAND);
  for (const s of ICON_SIZES) {
    writeFileSync(path.join(ICONS, `icon-${s}.png`), await makeIcon(sharp, s));
  }
  for (const s of [192, 512]) {
    writeFileSync(path.join(ICONS, `maskable-${s}.png`), await makeMaskable(sharp, s));
  }
  writeFileSync(path.join(PUB, "apple-touch-icon.png"), await makeMaskable(sharp, 180));
  writeFileSync(path.join(PUB, "favicon-32.png"), await makeIcon(sharp, 32));
  writeFileSync(path.join(PUB, "favicon-16.png"), await makeIcon(sharp, 16));
  for (const k of ["desktop-1280x720", "mobile-720x1280", "brand-1280x720"]) {
    writeFileSync(path.join(SHOTS, `${k}.png`), await makeScreenshot(sharp, k));
  }
  console.log(
    `   PWA  : ${ICON_SIZES.length}  +  maskable +   (${existsSync(ICONS) ? "ok" : "err"})`,
  );
}
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error("   :", e?.message ?? e);
    process.exit(0); // build       
  });
}
