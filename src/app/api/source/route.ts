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
 *
 * نکته فنی: ماژول‌های فایل‌سیستم به‌صورت «داینامیک» و فقط در زمان اجرا
 * بارگذاری می‌شوند. اگر به‌صورت ثابت import شوند، ابزار ردیابی Turbopack
 * تصور می‌کند کل پروژه وابستگی این مسیر است و هشدار
 * «Encountered unexpected file in NFT list» می‌دهد.
 */

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

type FsApi = {
  readFile: (p: string) => Promise<Buffer>;
  readdir: (p: string) => Promise<string[]>;
  stat: (p: string) => Promise<{ isDirectory: () => boolean; size: number }>;
  join: (...p: string[]) => string;
  root: string;
};

/** بارگذاری ماژول‌های سیستمی در زمان اجرا */
async function loadFs(): Promise<FsApi> {
  const fsp = await import("node:fs/promises");
  const nodePath = await import("node:path");
  return {
    readFile: (p: string) => fsp.readFile(p) as unknown as Promise<Buffer>,
    readdir: (p: string) => fsp.readdir(p),
    stat: (p: string) => fsp.stat(p),
    join: (...p: string[]) => nodePath.join(...p),
    root: process.cwd(),
  };
}

async function walk(fs: FsApi, dir: string, base = ""): Promise<string[]> {
  const out: string[] = [];
  let items: string[] = [];
  try {
    items = await fs.readdir(dir);
  } catch {
    return out;
  }
  for (const name of items) {
    if (name === ".git" || name === ".next") continue;
    const rel = base ? `${base}/${name}` : name;
    const full = fs.join(dir, name);
    let st;
    try {
      st = await fs.stat(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      out.push(...(await walk(fs, full, rel)));
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

  const fs = await loadFs();
  const files = (await walk(fs, fs.root)).sort();

  if (new URL(req.url).searchParams.get("list") === "1") {
    return Response.json({ count: files.length, files }, { headers: { "Cache-Control": "no-store" } });
  }

  const entries: ZipEntry[] = [];
  for (const rel of files) {
    try {
      entries.push({ path: `namayandeelmi-javad/${rel}`, content: await fs.readFile(fs.join(fs.root, rel)) });
    } catch {
      /* فایل خوانده نشد — رد می‌شود */
    }
  }

  entries.push({
    path: "namayandeelmi-javad/HOW-TO-UPDATE.md",
    content: `# نحوه به‌روزرسانی مخزن

این آرشیو شامل نسخه کامل و به‌روز سورس برنامه است (${entries.length} فایل).

## مراحل

1. محتویات این ZIP را در پوشه پروژه خود روی سیستم کپی کنید
   (فایل‌های قدیمی جایگزین شوند — پوشه‌های node_modules و .next را کپی نکنید).

2. در همان پوشه اجرا کنید:

\`\`\`bash
npm install
npm run build      # برای اطمینان از سالم بودن
git add -A
git status
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
