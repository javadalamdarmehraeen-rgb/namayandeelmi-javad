import { db } from "@/db";
import { attachments } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { eq } from "drizzle-orm";
export const dynamic = "force-dynamic";
/** / .      . */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  const { id } = await ctx.params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) return new Response("not found", { status: 404 });
  const rows = await db.select().from(attachments).where(eq(attachments.id, numId)).limit(1);
  const f = rows[0];
  if (!f) return new Response("not found", { status: 404 });
  const isAdmin = user?.role === "admin" || user?.role === "supervisor";
  if (!user || (!isAdmin && f.userId !== user.id)) return new Response("forbidden", { status: 403 });
  const download = new URL(req.url).searchParams.get("download") === "1";
  const buffer = Buffer.from(f.data, "base64");
  const bytes = new Uint8Array(buffer);
  return new Response(bytes, {
    headers: {
      "Content-Type": f.mimeType,
      "Content-Length": String(bytes.length),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${encodeURIComponent(f.fileName)}"`,
      "Cache-Control": "private, max-age=600",
    },
  });
}
