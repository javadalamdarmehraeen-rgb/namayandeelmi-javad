import { pngResponse, renderIcon } from "@/lib/pwa-image";

export const dynamic = "force-static";
export const revalidate = false;

/**
 * پشتیبان آیکون‌ها: اگر فایل استاتیک در public/icons موجود نباشد
 * (مثلاً هنگام انتقال به سرور جا مانده باشد)، همین مسیر آیکون PNG را
 * در لحظه از روی لوگو می‌سازد تا هرگز خطای ۴۰۴ رخ ندهد.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  const m = /^(icon|maskable)-(\d{2,4})\.png$/.exec(file);
  if (!m) return new Response("not found", { status: 404 });
  const size = Math.min(1024, Math.max(16, Number(m[2])));
  const bytes = await renderIcon(size, m[1] === "maskable");
  if (!bytes) return new Response("not available", { status: 404 });
  return pngResponse(bytes);
}
