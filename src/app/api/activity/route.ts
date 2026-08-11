import { db, dbRetry } from "@/db";
import { activityLogs, doctors, leaves, orders, pharmacies, trips, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { count, desc, eq, sql } from "drizzle-orm";
export const dynamic = "force-dynamic";
export async function GET() {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && user.role !== "supervisor")) {
    return Response.json({ error: " " }, { status: 401 });
  }
  const [logs, userRows, phG, drG, orG, trG, activeG, pendingLeaves] = await dbRetry(() => Promise.all([
    db.select().from(activityLogs).orderBy(desc(activityLogs.id)).limit(200),
    db
      .select({
        id: users.id,
        fullName: users.fullName,
        role: users.role,
        active: users.active,
        lastSeenAt: users.lastSeenAt,
      })
      .from(users)
      .orderBy(users.id),
    db.select({ uid: pharmacies.userId, c: count() }).from(pharmacies).groupBy(pharmacies.userId),
    db.select({ uid: doctors.userId, c: count() }).from(doctors).groupBy(doctors.userId),
    db.select({ uid: orders.userId, c: count() }).from(orders).groupBy(orders.userId),
    db.select({ uid: trips.userId, c: count() }).from(trips).groupBy(trips.userId),

    db
      .select({ uid: trips.userId, c: count() })
      .from(trips)
      .where(eq(trips.status, "active"))
      .groupBy(trips.userId),
    db.select({ c: count() }).from(leaves).where(eq(leaves.managerStatus, "pending")),
  ]), "activity:load");
  const toMap = (rows: { uid: number; c: number }[]) => {
    const m = new Map<number, number>();
    for (const r of rows) m.set(r.uid, Number(r.c));
    return m;
  };
  const mPh = toMap(phG);
  const mDr = toMap(drG);
  const mOr = toMap(orG);
  const mTr = toMap(trG);
  const mAc = toMap(activeG);
  const lastByUser = new Map<number, (typeof logs)[number]>();
  for (const l of logs) {
    if (l.userId != null && !lastByUser.has(l.userId)) lastByUser.set(l.userId, l);
  }
  const reps = userRows.map((u) => {
    const last = lastByUser.get(u.id);
    return {
      ...u,
      pharmacies: mPh.get(u.id) ?? 0,
      doctors: mDr.get(u.id) ?? 0,
      orders: mOr.get(u.id) ?? 0,
      trips: mTr.get(u.id) ?? 0,
      activeTrip: mAc.get(u.id) ?? 0,
      lastAction: last ? `${last.action}${last.detail ? ` — ${last.detail}` : ""}` : null,
      lastActionAt: last ? last.createdAt : null,
    };
  });
  const byRep: Record<string, typeof logs> = {};
  for (const l of logs) {
    const k = l.userName || "";
    (byRep[k] ??= []).push(l);
  }
  const sum = (m: Map<number, number>) => [...m.values()].reduce((a, b) => a + b, 0);
  const counts = {
    pharmacies: sum(mPh),
    doctors: sum(mDr),
    orders: sum(mOr),
    trips: sum(mTr),
    activeTrips: sum(mAc),
    users: userRows.length,
    leaves: Number(pendingLeaves[0]?.c ?? 0),
  };
  void sql;
  return Response.json({ logs, counts, reps, byRep });
}
