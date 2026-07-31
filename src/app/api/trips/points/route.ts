import { db } from "@/db";
import { tripPoints, trips } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const tripId = Number(new URL(req.url).searchParams.get("tripId"));
  if (!Number.isFinite(tripId)) return Response.json({ error: "شناسه نامعتبر" }, { status: 400 });
  const t = (await db.select().from(trips).where(eq(trips.id, tripId)).limit(1))[0];
  if (!t || (user.role !== "admin" && t.userId !== user.id)) {
    return Response.json({ error: "سفر یافت نشد" }, { status: 404 });
  }
  const points = await db
    .select()
    .from(tripPoints)
    .where(eq(tripPoints.tripId, tripId))
    .orderBy(asc(tripPoints.recordedAt))
    .limit(5000);
  return Response.json({ trip: t, points });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const tripId = Number(b.tripId);
  if (!Number.isFinite(tripId)) return Response.json({ error: "شناسه نامعتبر" }, { status: 400 });
  const t = (await db.select().from(trips).where(eq(trips.id, tripId)).limit(1))[0];
  if (!t || t.userId !== user.id) return Response.json({ error: "سفر یافت نشد" }, { status: 404 });

  const raw = Array.isArray(b.points) ? b.points : [];
  const values = raw
    .map((p: Record<string, unknown>) => ({
      tripId,
      lat: Number(p.lat),
      lng: Number(p.lng),
      accuracy: Number(p.accuracy) || null,
      kind: ["start", "move", "pause", "end"].includes(String(p.kind)) ? String(p.kind) : "move",
      note: String(p.note ?? "").slice(0, 200),
      recordedAt: p.recordedAt ? new Date(String(p.recordedAt)) : new Date(),
      synced: true,
    }))
    .filter((p: { lat: number; lng: number }) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .slice(0, 500);
  if (values.length) await db.insert(tripPoints).values(values);
  return Response.json({ ok: true, inserted: values.length });
}
