import { db, dbRetrySafe } from "@/db";
import { liveLocations, trips, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { desc, eq, sql } from "drizzle-orm";
export const dynamic = "force-dynamic";
/**
 *   .
 *
 * POST →       (    )
 * GET  →       
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const lat = Number(b.lat);
  const lng = Number(b.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json({ error: " " }, { status: 400 });

  }
  const values = {
    userId: user.id,
    repName: user.fullName,
    lat,
    lng,
    accuracy: Number(b.accuracy) || null,
    speed: Number(b.speed) || null,
    heading: Number(b.heading) || null,
    battery: Number.isFinite(Number(b.battery)) ? Math.round(Number(b.battery)) : null,
    gpsOn: b.gpsOn !== false,
    online: true,
    tripId: Number(b.tripId) || null,
    recordedAt: b.recordedAt ? new Date(String(b.recordedAt)) : new Date(),
    updatedAt: new Date(),
  };
  await dbRetrySafe(
    () =>
      db
        .insert(liveLocations)
        .values(values)
        .onConflictDoUpdate({ target: liveLocations.userId, set: values }),
    undefined,
    "live:upsert",
  );
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const isManager = user.role === "admin" || user.role === "supervisor";
  const rows = await dbRetrySafe(
    () =>
      db
        .select({
          userId: liveLocations.userId,
          repName: liveLocations.repName,
          lat: liveLocations.lat,
          lng: liveLocations.lng,
          accuracy: liveLocations.accuracy,
          speed: liveLocations.speed,
          battery: liveLocations.battery,
          gpsOn: liveLocations.gpsOn,
          tripId: liveLocations.tripId,
          recordedAt: liveLocations.recordedAt,
          updatedAt: liveLocations.updatedAt,
        })
        .from(liveLocations)
        .orderBy(desc(liveLocations.updatedAt)),
    [],
    "live:list",
  );
  const scoped = isManager ? rows : rows.filter((r) => r.userId === user.id);
  //     
  const active = await dbRetrySafe(
    () =>
      db
        .select({ userId: trips.userId, id: trips.id, distanceM: trips.distanceM })
        .from(trips)
        .where(eq(trips.status, "active")),
    [],
    "live:trips",
  );
  const allUsers = isManager
    ? await dbRetrySafe(
        () => db.select({ id: users.id, fullName: users.fullName, role: users.role, active: users.active }).from(users),
        [],
        "live:users",
      )
    : [];
  const now = Date.now();
  const enriched = scoped.map((r) => {
    const ageMs = now - new Date(r.updatedAt).getTime();
    return {
      ...r,
      ageMs,

      /** :        */
      live: ageMs < 3 * 60 * 1000,
      stale: ageMs >= 3 * 60 * 1000 && ageMs < 60 * 60 * 1000,
      activeTrip: active.find((t) => t.userId === r.userId) ?? null,
    };
  });
  //     
  const missing = allUsers
    .filter((u) => u.role === "rep" && u.active && !scoped.some((r) => r.userId === u.id))
    .map((u) => ({ userId: u.id, repName: u.fullName }));
  void sql;
  return Response.json({ rows: enriched, missing }, { headers: { "Cache-Control": "no-store" } });
}
