import { pngResponse, renderIcon } from "@/lib/pwa-image";
export const dynamic = "force-static";

export const revalidate = false;
export async function GET() {
  const bytes = await renderIcon(180, true);
  if (!bytes) return new Response("not available", { status: 404 });
  return pngResponse(bytes);
}
