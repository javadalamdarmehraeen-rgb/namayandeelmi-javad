import { db } from "@/db";
import { attachments } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { and, desc, eq, inArray } from "drizzle-orm";
export const dynamic = "force-dynamic";
const MAX_BYTES = 3 * 1024 * 1024; // 3MB
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const url = new URL(req.url);
  const ownerType = url.searchParams.get("ownerType") ?? "doctor";
  const ownerId = url.searchParams.get("ownerId");
  const isAdmin = user.role === "admin" || user.role === "supervisor";
  const conds = [eq(attachments.ownerType, ownerType)];
  if (ownerId) conds.push(eq(attachments.ownerId, Number(ownerId)));
  if (!isAdmin) conds.push(eq(attachments.userId, user.id));
  const rows = await db
    .select({
      id: attachments.id,
      ownerId: attachments.ownerId,

      fileName: attachments.fileName,
      mimeType: attachments.mimeType,
      size: attachments.size,
      repName: attachments.repName,
      createdAt: attachments.createdAt,
    })
    .from(attachments)
    .where(and(...conds))
    .orderBy(desc(attachments.id))
    .limit(300);
  return Response.json({ rows });
}
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const dataUrl = String(b.data ?? "");
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return Response.json({ error: "  " }, { status: 400 });
  const mimeType = match[1].slice(0, 100);
  const base64 = match[2];
  const size = Math.floor((base64.length * 3) / 4);
  if (size > MAX_BYTES) {
    return Response.json({ error: "       " }, { status: 400 });
  }
  const [row] = await db
    .insert(attachments)
    .values({
      ownerType: String(b.ownerType ?? "doctor").slice(0, 30),
      ownerId: Number(b.ownerId) || null,
      userId: user.id,
      repName: user.fullName,
      fileName: String(b.fileName ?? "file").slice(0, 200),
      mimeType,
      size,
      data: base64,
    })
    .returning({
      id: attachments.id,
      fileName: attachments.fileName,
      mimeType: attachments.mimeType,
      size: attachments.size,
      ownerId: attachments.ownerId,
    });
  return Response.json({ row });
}
/**    ( )     */
export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const ids: number[] = Array.isArray(b.ids) ? b.ids.map(Number).filter(Number.isFinite) : [];
  const ownerId = Number(b.ownerId);
  if (!ids.length || !Number.isFinite(ownerId)) return Response.json({ error: " " }, { status: 400 });
  await db
    .update(attachments)
    .set({ ownerId })
    .where(and(inArray(attachments.id, ids), eq(attachments.userId, user.id)));
  return Response.json({ ok: true });
}
export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isFinite(id)) return Response.json({ error: " " }, { status: 400 });
  if (user.role === "admin") await db.delete(attachments).where(eq(attachments.id, id));
  else await db.delete(attachments).where(and(eq(attachments.id, id), eq(attachments.userId, user.id)));
  return Response.json({ ok: true });
}
