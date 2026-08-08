import { getSessionUser } from "@/lib/auth";
import { ensureSeed } from "@/lib/bootstrap";
import { syncAll } from "@/lib/sync";
import { syncSecret } from "@/lib/sync-config";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * اجرای دستی/زمان‌بندی‌شده همگام‌سازی.
 * - مدیر از پنل
 * - یا سرویس Cron با هدر x-sync-key
 */
async function authorize(req: Request) {
  const key = req.headers.get("x-sync-key") ?? new URL(req.url).searchParams.get("key");
  if (key && syncSecret() && key === syncSecret()) return true;
  const user = await getSessionUser();
  return Boolean(user && (user.role === "admin" || user.permissions.includes("users")));
}

export async function POST(req: Request) {
  await ensureSeed();
  if (!(await authorize(req))) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const reports = await syncAll();
  const ok = reports.every((r) => r.ok);
  return Response.json(
    {
      ok,
      count: reports.length,
      reports,
      summary:
        reports.length === 0
          ? "همتایی تنظیم نشده است"
          : reports.map((r) => `${r.peer}: ${r.ok ? `✔ دریافت ${r.pulled} / ارسال ${r.pushed}` : `✖ ${r.detail}`}`).join(" | "),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(req: Request) {
  return POST(req);
}
