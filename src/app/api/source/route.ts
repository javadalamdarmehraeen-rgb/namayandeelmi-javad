import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { getSessionUser } from "@/lib/auth";
import { createZip, type ZipEntry } from "@/lib/zip";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * دانلود کامل سورس پروژه به‌صورت فایل ZIP (فقط مدیر).
 *
 * کاربرد: انتقال کدهای به‌روز از سرور به سیستم شما تا در
 * GitHub / GitLab قرار دهید و روی هر دو سرور منتشر شود.
 *
 * GET /api/source            → همه فایل‌های پروژه
 * GET /api/source?list=1     → فقط فهرست فایل‌ها (JSON)
 */

const ROOT = process.cwd();

/** پوشه‌هایی که هرگز در آرشیو قرار نمی‌گیرند */
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".turbo",
  "dist",
  "build",
  ".vercel",
  ".cache",
  "coverage",
]);

/** فایل‌هایی که به دلایل امنیتی یا حجمی حذف می‌شوند */
const SKIP_FILES = new Set([".env", ".env.local", ".env.production", "package-lock.json"]);

const MAX_FILE_BYTES = 3 * 1024 * 1024;

async function walk(dir: string, base = ""): Promise<string[]> {
  const out: string[] = [];
  let items: string[] = [];
  try {
    items = await readdir(dir);
  } catch {
    return out;
  }
  for (const name of items) {
    if (name.startsWith(".") && (name === ".git" || name === ".next")) continue;
    const rel = base ? `${base}/${name}` : name;
    const full = path.join(dir, name);
    let st;
    try {
      st = await stat(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      out.push(...(await walk(full, rel)));
    } else {
      if (SKIP_FILES.has(name)) continue;
      if (st.size > MAX_FILE_BYTES) continue;
      out.push(rel);
    }
  }
  return out;
}

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return Response.json({ error: "دسترسی غیرمجاز — فقط مدیر" }, { status: 401 });
  }

  const files = (await walk(ROOT)).sort();

  if (new URL(req.url).searchParams.get("list") === "1") {
    return Response.json({ count: files.length, files }, { headers: { "Cache-Control": "no-store" } });
  }

  const entries: ZipEntry[] = [];
  for (const rel of files) {
    try {
      entries.push({ path: `namayandeelmi-javad/${rel}`, content: await readFile(path.join(ROOT, rel)) });
    } catch {
      /* فایل خوانده نشد — رد می‌شود */
    }
  }

  // راهنمای کوتاه داخل آرشیو
  entries.push({
    path: "namayandeelmi-javad/HOW-TO-UPDATE.md",
    content: `# نحوه به‌روزرسانی مخزن

این آرشیو شامل نسخه کامل و به‌روز سورس برنامه است (${entries.length} فایل).

## مراحل

1. محتویات این ZIP را در پوشه پروژه خود روی سیستم کپی کنید
   (فایل‌های قدیمی جایگزین شوند — پوشه‌های node_modules و .next را کپی نکنید).

2. در همان پوشه اجرا کنید:

\`\`\`bash
git add -A
git status          # باید فایل‌های تغییر یافته را نشان دهد
git commit -m "به‌روزرسانی کامل برنامه"
git push origin main
\`\`\`

3. اگر مخزن GitLab هم دارید:

\`\`\`bash
git remote add gitlab https://gitlab.com/USER/REPO.git   # فقط بار اول
git push gitlab main
\`\`\`

## متغیرهای محیطی

فایل \`.env\` در این آرشیو نیست (به دلایل امنیتی).
نمونه تنظیمات سرور داخلی در \`.env.ndcohub.example\` قرار دارد.

تاریخ ساخت: ${new Date().toISOString()}
`,
  });

  const zip = createZip(entries);
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");

  return new Response(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Length": String(zip.length),
      "Content-Disposition": `attachment; filename="namayandeelmi-source-${stamp}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
