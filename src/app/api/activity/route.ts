import { db } from "@/db";
import { activityLogs, doctors, orders, pharmacies, trips, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const logs = await db.select().from(activityLogs).orderBy(desc(activityLogs.id)).limit(100);
  const [counts] = await db
    .select({
      pharmacies: sql<number>`(select count(*) from pharmacies)`,
      doctors: sql<number>`(select count(*) from doctors)`,
      orders: sql<number>`(select count(*) from orders)`,
      trips: sql<number>`(select count(*) from trips)`,
      activeTrips: sql<number>`(select count(*) from trips where status = 'active')`,
      users: sql<number>`(select count(*) from users)`,
    })
    .from(sql`(select 1) as t`);
  void pharmacies;
  void doctors;
  void orders;
  void trips;
  void users;
  return Response.json({ logs, counts });
}
