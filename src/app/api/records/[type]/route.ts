import { db } from "@/db";
import { activityLogs, doctors, orders, pharmacies } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { desc, eq, SQL } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ type: string }> };

const num = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n !== 0 ? n : null;
};
const str = (v: unknown, max = 500) => String(v ?? "").trim().slice(0, max);

export async function GET(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const { type } = await ctx.params;
  const url = new URL(req.url);
  const userIdFilter = url.searchParams.get("userId");
  const isAdmin = user.role === "admin" || user.role === "supervisor";
  const limit = Math.min(Number(url.searchParams.get("limit")) || 300, 1000);

  try {
    if (type === "pharmacies") {
      const w: SQL | undefined = !isAdmin
        ? eq(pharmacies.userId, user.id)
        : userIdFilter
          ? eq(pharmacies.userId, Number(userIdFilter))
          : undefined;
      const rows = await db.select().from(pharmacies).where(w).orderBy(desc(pharmacies.id)).limit(limit);
      return Response.json({ rows });
    }
    if (type === "doctors") {
      const w: SQL | undefined = !isAdmin
        ? eq(doctors.userId, user.id)
        : userIdFilter
          ? eq(doctors.userId, Number(userIdFilter))
          : undefined;
      const rows = await db.select().from(doctors).where(w).orderBy(desc(doctors.id)).limit(limit);
      return Response.json({ rows });
    }
    if (type === "orders") {
      const w: SQL | undefined = !isAdmin
        ? eq(orders.userId, user.id)
        : userIdFilter
          ? eq(orders.userId, Number(userIdFilter))
          : undefined;
      const rows = await db.select().from(orders).where(w).orderBy(desc(orders.id)).limit(limit);
      return Response.json({ rows });
    }
  } catch {
    return Response.json({ error: "خطا در خواندن اطلاعات" }, { status: 500 });
  }
  return Response.json({ error: "نوع نامعتبر" }, { status: 400 });
}

export async function POST(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const { type } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const base = {
    userId: user.id,
    repName: user.fullName,
    dateShamsi: str(body.dateShamsi, 12),
    lat: num(body.lat),
    lng: num(body.lng),
    accuracy: num(body.accuracy),
    locationLabel: str(body.locationLabel, 200),
  };

  try {
    if (type === "pharmacies") {
      if (!base.dateShamsi || !str(body.name)) {
        return Response.json({ error: "تاریخ و نام داروخانه الزامی است" }, { status: 400 });
      }
      const [row] = await db
        .insert(pharmacies)
        .values({
          ...base,
          province: str(body.province, 100),
          city: str(body.city, 100),
          region: str(body.region, 100),
          name: str(body.name, 200),
          landline: str(body.landline, 20),
          managerName: str(body.managerName, 160),
          managerPhone: str(body.managerPhone, 20),
          address: str(body.address, 1000),
          locationLabel: base.locationLabel || str(body.name, 200),
        })
        .returning();
      await log(user.id, user.fullName, "ثبت داروخانه", str(body.name, 200));
      return Response.json({ row });
    }
    if (type === "doctors") {
      if (!base.dateShamsi || !str(body.name)) {
        return Response.json({ error: "تاریخ و نام پزشک الزامی است" }, { status: 400 });
      }
      const [row] = await db
        .insert(doctors)
        .values({
          ...base,
          province: str(body.province, 100),
          city: str(body.city, 100),
          region: str(body.region, 100),
          name: str(body.name, 200),
          specialty: str(body.specialty, 160),
          phone: str(body.phone, 20),
          secretaryName: str(body.secretaryName, 160),
          secretaryPhone: str(body.secretaryPhone, 20),
          address: str(body.address, 1000),
          otherAddresses: str(body.otherAddresses, 2000),
          locationLabel: base.locationLabel || str(body.name, 200),
        })
        .returning();
      await log(user.id, user.fullName, "ثبت پزشک", str(body.name, 200));
      return Response.json({ row });
    }
    if (type === "orders") {
      if (!base.dateShamsi || !str(body.pharmacyName)) {
        return Response.json({ error: "تاریخ و نام داروخانه الزامی است" }, { status: 400 });
      }
      const items: Record<string, number> = {};
      for (const [k, v] of Object.entries((body.items ?? {}) as Record<string, unknown>)) {
        const n = Number(v);
        if (Number.isFinite(n) && n !== 0) items[k] = n;
      }
      const [row] = await db
        .insert(orders)
        .values({
          ...base,
          pharmacyName: str(body.pharmacyName, 200),
          managerName: str(body.managerName, 160),
          managerPhone: str(body.managerPhone, 20),
          address: str(body.address, 1000),
          locationLabel: base.locationLabel || str(body.pharmacyName, 200),
          items,
          distributor: str(body.distributor, 160),
          visitor: str(body.visitor, 160),
          notes: str(body.notes, 2000),
        })
        .returning();
      await log(user.id, user.fullName, "ثبت سفارش", str(body.pharmacyName, 200));
      return Response.json({ row });
    }
  } catch {
    return Response.json({ error: "خطا در ثبت اطلاعات" }, { status: 500 });
  }
  return Response.json({ error: "نوع نامعتبر" }, { status: 400 });
}

async function log(userId: number, userName: string, action: string, detail: string) {
  try {
    await db.insert(activityLogs).values({ userId, userName, action, detail });
  } catch {
    /* ignore */
  }
}
