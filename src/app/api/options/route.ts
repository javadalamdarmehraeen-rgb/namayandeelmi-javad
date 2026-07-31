import { db } from "@/db";
import { options } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { ensureSeed } from "@/lib/bootstrap";
import { and, asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureSeed();
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const category = new URL(req.url).searchParams.get("category");
  const rows = category
    ? await db.select().from(options).where(eq(options.category, category)).orderBy(asc(options.value))
    : await db.select().from(options).orderBy(asc(options.category), asc(options.value));
  return Response.json({ rows });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const category = String(body.category ?? "").trim();
  const value = String(body.value ?? "").trim().slice(0, 200);
  if (!category || !value) return Response.json({ error: "مقدار نامعتبر" }, { status: 400 });
  const exists = await db
    .select()
    .from(options)
    .where(and(eq(options.category, category), eq(options.value, value)))
    .limit(1);
  if (exists.length) return Response.json({ row: exists[0] });
  const [row] = await db.insert(options).values({ category, value }).returning();
  return Response.json({ row });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isFinite(id)) return Response.json({ error: "شناسه نامعتبر" }, { status: 400 });
  await db.delete(options).where(eq(options.id, id));
  return Response.json({ ok: true });
}
