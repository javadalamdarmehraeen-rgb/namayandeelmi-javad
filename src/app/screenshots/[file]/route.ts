import { pngResponse, renderScreenshot } from "@/lib/pwa-image";
export const dynamic = "force-static";
export const revalidate = false;
/**   —      SVG */
export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  if (!/^[\w-]+\.png$/.test(file)) return new Response("not found", { status: 404 });
  const bytes = await renderScreenshot(file.replace(/\.png$/, ""));
  if (!bytes) return new Response("not available", { status: 404 });
  return pngResponse(bytes);
}
