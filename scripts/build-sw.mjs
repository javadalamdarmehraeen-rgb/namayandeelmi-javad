#!/usr/bin/env node
/**
 * تولید فهرست پیش‌کش سرویس‌ورکر پس از build.
 *
 * چرا حیاتی است؟ برنامه یک اپ React است؛ فایل HTML بدون فایل‌های
 * جاوااسکریپت خود بی‌فایده است. اگر فقط HTML کش شود، روی اینترنت
 * موبایل (کند) چانک‌ها تایم‌اوت می‌کنند و صفحه سفید می‌ماند.
 * این اسکریپت همه چانک‌های JS/CSS واقعی build را در سرویس‌ورکر ثبت می‌کند.
 */
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const NEXT_STATIC = path.join(ROOT, ".next", "static");
const SW_SRC = path.join(ROOT, "public", "sw-template.js");
const SW_OUT = path.join(ROOT, "public", "sw.js");

function walk(dir, base) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full, `${base}/${name}`));
    else out.push({ url: `${base}/${name}`, size: st.size });
  }
  return out;
}

const PAGES = [
  "/",
  "/login",
  "/offline",
  "/install",
  "/diagnostics",
  "/panel",
  "/panel/pharmacies",
  "/panel/doctors",
  "/panel/orders",
  "/panel/trip",
  "/panel/map",
  "/panel/home",
  "/panel/leaves",
  "/panel/notifications",
  "/panel/options",
  "/panel/reports",
  "/admin",
  "/admin/activity",
  "/admin/records/pharmacies",
  "/admin/records/doctors",
  "/admin/records/orders",
  "/admin/map",
  "/admin/live",
  "/admin/trips",
  "/admin/homes",
  "/admin/leaves",
  "/admin/notifications",
  "/admin/reports",
  "/admin/options",
  "/admin/columns",
  "/admin/users",
  "/admin/messengers",
  "/admin/backup",
];

const EXTRAS = [
  "/manifest.webmanifest",
  "/logo.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/apple-touch-icon.png",
  "/data/world-countries.geojson",
  "/data/iran-provinces.geojson",
];

function main() {
  if (!existsSync(SW_SRC)) {
    console.warn("⚠️  فایل sw-template.js پیدا نشد؛ sw.js بدون تغییر ماند.");
    return;
  }
  const assets = walk(NEXT_STATIC, "/_next/static")
    .filter((a) => /\.(js|css|woff2?)$/i.test(a.url))
    // فایل‌های بسیار بزرگ (نقشه و مانند آن) در بار اول کش نمی‌شوند
    .filter((a) => a.size < 700 * 1024)
    .map((a) => a.url)
    .sort();

  const total = walk(NEXT_STATIC, "/_next/static").reduce((s, a) => s + a.size, 0);
  const build = `${Date.now().toString(36)}-${assets.length}`;

  // نسخه RSC صفحات هم پیش‌کش می‌شود تا ناوبری داخلی آفلاین کار کند
  const rscPages = PAGES.map((p) => `${p}${p.includes("?") ? "&" : "?"}_rsc=offline`);

  let sw = readFileSync(SW_SRC, "utf8");
  sw = sw
    .replace("__BUILD_ID__", build)
    .replace("__PAGES__", JSON.stringify(PAGES, null, 2))
    .replace("__RSC_PAGES__", JSON.stringify(rscPages, null, 2))
    .replace("__ASSETS__", JSON.stringify(assets, null, 2))
    .replace("__EXTRAS__", JSON.stringify(EXTRAS, null, 2));

  writeFileSync(SW_OUT, sw);
  console.log(
    `✅ سرویس‌ورکر ساخته شد: ${PAGES.length} صفحه + ${assets.length} فایل استاتیک (${Math.round(total / 1024)} کیلوبایت) پیش‌کش می‌شوند`,
  );
}

main();
