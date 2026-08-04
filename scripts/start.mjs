#!/usr/bin/env node
/**
 * Self-healing production starter.
 *
 * بعضی سرویس‌ها (مثل Render وقتی Build Command خالی باشد) فقط `npm start` را
 * اجرا می‌کنند و در نتیجه پوشه‌ی `.next` وجود ندارد و خطای
 * "Could not find a production build in the '.next' directory" می‌گیرید.
 * این اسکریپت اگر بیلد آماده نبود، ابتدا خودش `next build` را اجرا می‌کند و
 * سپس سرور را روی پورتی که پلتفرم اعلام کرده بالا می‌آورد.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const buildIdFile = path.join(root, ".next", "BUILD_ID");
const port = process.env.PORT || "3000";
const host = process.env.HOST || "0.0.0.0";
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

function run(args, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [nextBin, ...args], {
      stdio: "inherit",
      env: process.env,
    });
    child.on("exit", (code, signal) => {
      if (signal) return reject(new Error(`${label} terminated by ${signal}`));
      if (code !== 0) return reject(new Error(`${label} exited with code ${code}`));
      resolve();
    });
    child.on("error", reject);
  });
}

async function main() {
  if (!existsSync(buildIdFile)) {
    console.log("⚙️  production build not found – running `next build` first...");
    await run(["build"], "next build");
    console.log("✅ build finished, starting server...");
  }
  console.log(`🚀 starting Next.js on ${host}:${port}`);
  await run(["start", "-H", host, "-p", String(port)], "next start");
}

main().catch((err) => {
  console.error("❌ start failed:", err.message);
  process.exit(1);
});
