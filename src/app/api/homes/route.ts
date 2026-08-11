import { db } from "@/db";
import { activityLogs, homes } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";
export const dynamic = "force-dynamic";
export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const isAdmin = user.role === "admin" || user.role === "supervisor";

  const rows = isAdmin
    ? await db.select().from(homes).orderBy(desc(homes.id))
    : await db.select().from(homes).where(eq(homes.userId, user.id)).orderBy(desc(homes.id));
  return Response.json({ rows });
}
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const lat = Number(b.lat);
  const lng = Number(b.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json({ error: "      " }, { status: 400 });
  }
  const values = {
    userId: user.id,
    repName: user.fullName,
    title: String(b.title ?? "").trim().slice(0, 160) || "",
    address: String(b.address ?? "").trim().slice(0, 1000),
    lat,
    lng,
    accuracy: Number(b.accuracy) || null,
    updatedAt: new Date(),
  };
  const existing = await db.select().from(homes).where(eq(homes.userId, user.id)).limit(1);
  let row;
  if (existing.length) {
    [row] = await db.update(homes).set(values).where(eq(homes.id, existing[0].id)).returning();
  } else {
    [row] = await db.insert(homes).values(values).returning();
  }
  await db
    .insert(activityLogs)
    .values({ userId: user.id, userName: user.fullName, action: "  ", detail: values.title })
    .catch(() => undefined);
  return Response.json({ row });
}
