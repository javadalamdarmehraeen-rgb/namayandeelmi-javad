import { db } from "@/db";
import { liveLocations, tripPoints, trips } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { asc, eq } from "drizzle-orm";
/**        */
function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const d = 2 * R * Math.asin(Math.sqrt(s));
  //  GPS:        
  return d < 5 || d > 5000 ? 0 : d;
}
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });

  const tripId = Number(new URL(req.url).searchParams.get("tripId"));
  if (!Number.isFinite(tripId)) return Response.json({ error: " " }, { status: 400 });
  const t = (await db.select().from(trips).where(eq(trips.id, tripId)).limit(1))[0];
  if (!t || (user.role !== "admin" && t.userId !== user.id)) {
    return Response.json({ error: "  " }, { status: 404 });
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
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const tripId = Number(b.tripId);
  if (!Number.isFinite(tripId)) return Response.json({ error: " " }, { status: 400 });
  const t = (await db.select().from(trips).where(eq(trips.id, tripId)).limit(1))[0];
  if (!t || t.userId !== user.id) return Response.json({ error: "  " }, { status: 404 });
  const raw = Array.isArray(b.points) ? b.points : [];
  const values = raw
    .map((p: Record<string, unknown>) => ({
      tripId,
      lat: Number(p.lat),
      lng: Number(p.lng),
      accuracy: Number(p.accuracy) || null,
      speed: Number(p.speed) || null,
      stopSeconds: Math.max(0, Math.round(Number(p.stopSeconds) || 0)),
      gpsOn: p.gpsOn !== false,
      kind: ["start", "move", "pause", "end"].includes(String(p.kind)) ? String(p.kind) : "move",
      note: String(p.note ?? "").slice(0, 200),
      recordedAt: p.recordedAt ? new Date(String(p.recordedAt)) : new Date(),
      synced: true,
    }))
    .filter((p: { lat: number; lng: number }) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .slice(0, 500);
  if (values.length) await db.insert(tripPoints).values(values);
  //      
  try {
    const all = await db
      .select({ lat: tripPoints.lat, lng: tripPoints.lng, stopSeconds: tripPoints.stopSeconds })
      .from(tripPoints)
      .where(eq(tripPoints.tripId, tripId))
      .orderBy(asc(tripPoints.recordedAt));
    let dist = 0;
    for (let i = 1; i < all.length; i++) dist += haversine(all[i - 1], all[i]);
    const stops = all.reduce((a, x) => a + (x.stopSeconds ?? 0), 0);
    await db.update(trips).set({ distanceM: Math.round(dist), stopSeconds: stops }).where(eq(trips.id, tripId));
    //     
    const last = values[values.length - 1];
    if (last) {
      const lv = {
        userId: user.id,
        repName: user.fullName,
        lat: last.lat,
        lng: last.lng,
        accuracy: last.accuracy,
        speed: last.speed,
        gpsOn: last.gpsOn,
        online: true,
        tripId,
        recordedAt: last.recordedAt,
        updatedAt: new Date(),
      };
      await db.insert(liveLocations).values(lv).onConflictDoUpdate({ target: liveLocations.userId, set: lv });
    }
  } catch {
    /*         */
  }
  return Response.json({ ok: true, inserted: values.length });
}
