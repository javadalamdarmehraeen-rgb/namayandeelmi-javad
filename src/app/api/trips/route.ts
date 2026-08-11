import { db } from "@/db";
import { activityLogs, tripPoints, trips } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { todayJalali } from "@/lib/jalali";
import { and, count, desc, eq, sql } from "drizzle-orm";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const onlyActive = new URL(req.url).searchParams.get("active") === "1";
  const base = db
    .select({
      id: trips.id,
      userId: trips.userId,
      repName: trips.repName,
      dateShamsi: trips.dateShamsi,
      status: trips.status,
      distanceM: trips.distanceM,
      stopSeconds: trips.stopSeconds,
      startedAt: trips.startedAt,
      endedAt: trips.endedAt,
    })
    .from(trips);
  const isManager = user.role === "admin" || user.role === "supervisor";
  const list = isManager
    ? await (onlyActive ? base.where(eq(trips.status, "active")) : base).orderBy(desc(trips.id)).limit(300)
    : await base.where(eq(trips.userId, user.id)).orderBy(desc(trips.id)).limit(100);
  //     (    )
  const counts = await db
    .select({ tripId: tripPoints.tripId, c: count() })
    .from(tripPoints)
    .groupBy(tripPoints.tripId);
  const cmap = new Map(counts.map((c) => [c.tripId, Number(c.c)]));
  void sql;
  const rows = list.map((t) => ({ ...t, points: cmap.get(t.id) ?? 0 }));
  return Response.json({ rows });
}
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  // close any dangling active trips of this user
  await db
    .update(trips)
    .set({ status: "ended", endedAt: new Date() })
    .where(and(eq(trips.userId, user.id), eq(trips.status, "active")));
  const [row] = await db
    .insert(trips)
    .values({
      userId: user.id,
      repName: user.fullName,
      dateShamsi: todayJalali(),
      status: "active",
    })
    .returning();
  if (Number.isFinite(Number(b.lat)) && Number.isFinite(Number(b.lng))) {
    await db.insert(tripPoints).values({

      tripId: row.id,
      lat: Number(b.lat),
      lng: Number(b.lng),
      accuracy: Number(b.accuracy) || null,
      kind: "start",
      note: " ",
    });
  }
  await db.insert(activityLogs).values({
    userId: user.id,
    userName: user.fullName,
    action: " ",
    detail: ` #${row.id}`,
  });
  return Response.json({ trip: row });
}
export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const id = Number(b.id);
  if (!Number.isFinite(id)) return Response.json({ error: " " }, { status: 400 });
  const rows = await db.select().from(trips).where(eq(trips.id, id)).limit(1);
  const trip = rows[0];
  if (!trip || (user.role !== "admin" && trip.userId !== user.id)) {
    return Response.json({ error: "  " }, { status: 404 });
  }
  if (b.action === "end") {
    if (Number.isFinite(Number(b.lat)) && Number.isFinite(Number(b.lng))) {
      await db.insert(tripPoints).values({
        tripId: id,
        lat: Number(b.lat),
        lng: Number(b.lng),
        kind: "end",
        note: " ",
      });
    }
    await db.update(trips).set({ status: "ended", endedAt: new Date() }).where(eq(trips.id, id));
    await db.insert(activityLogs).values({
      userId: user.id,
      userName: user.fullName,
      action: " ",
      detail: ` #${id}`,
    });
  }
  return Response.json({ ok: true });
}
