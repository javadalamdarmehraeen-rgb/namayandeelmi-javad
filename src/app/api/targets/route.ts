import { db, dbRetry, dbRetrySafe } from "@/db";
import { orders, targets, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { ensureSeed } from "@/lib/bootstrap";
import { bonusKeyOf } from "@/lib/defaults";

import { getProducts } from "@/lib/settings-server";
import { todayJalali } from "@/lib/jalali";
import { and, eq, SQL } from "drizzle-orm";
export const dynamic = "force-dynamic";
export type TargetProgress = {
  productKey: string;
  productLabel: string;
  quantity: number;
  priceDistributor: number;
  pricePharmacy: number;
  /**     */
  sold: number;
  /**    */
  bonus: number;
  remaining: number;
  percent: number;
  valueDistributor: number;
  valuePharmacy: number;
  soldValueDistributor: number;
  soldValuePharmacy: number;
};
const currentPeriod = () => todayJalali().slice(0, 7);
/**
 * GET /api/targets?userId=&period=
 *    :        
 */
export async function GET(req: Request) {
  await ensureSeed();
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const url = new URL(req.url);
  const isManager = user.role === "admin" || user.role === "supervisor";
  const scopeId = isManager ? Number(url.searchParams.get("userId")) || user.id : user.id;
  const period = url.searchParams.get("period") ?? currentPeriod();
  const allPeriods = url.searchParams.get("all") === "1";
  const products = await getProducts();
  //   (  +  )
  const rows = await dbRetrySafe(
    () => db.select().from(targets).where(eq(targets.userId, scopeId)),
    [],
    "targets:list",
  );
  const forPeriod = rows.filter((t) => allPeriods || t.period === period || t.period === "");
  //   
  const orderRows = await dbRetrySafe(
    () => db.select({ d: orders.dateShamsi, items: orders.items }).from(orders).where(eq(orders.userId, scopeId)),
    [],
    "targets:orders",
  );
  const scoped = allPeriods ? orderRows : orderRows.filter((o) => o.d.startsWith(period));
  const sold: Record<string, number> = {};
  const bonusMap: Record<string, number> = {};
  for (const o of scoped) {
    for (const p of products) {
      sold[p.key] = (sold[p.key] ?? 0) + Number(o.items?.[p.key] ?? 0);
      bonusMap[p.key] = (bonusMap[p.key] ?? 0) + Number(o.items?.[bonusKeyOf(p.key)] ?? 0);
    }
  }
  const progress: TargetProgress[] = products.map((p) => {
    const t = forPeriod.find((x) => x.productKey === p.key);
    const quantity = t?.quantity ?? 0;
    const pd = t?.priceDistributor ?? 0;
    const pp = t?.pricePharmacy ?? 0;
    const s = sold[p.key] ?? 0;
    return {
      productKey: p.key,
      productLabel: p.label,
      quantity,
      priceDistributor: pd,
      pricePharmacy: pp,
      sold: s,
      bonus: bonusMap[p.key] ?? 0,
      remaining: Math.max(0, quantity - s),
      percent: quantity > 0 ? Math.min(999, Math.round((s / quantity) * 100)) : 0,
      valueDistributor: quantity * pd,

      valuePharmacy: quantity * pp,
      soldValueDistributor: s * pd,
      soldValuePharmacy: s * pp,
    };
  });
  const totals = progress.reduce(
    (a, r) => ({
      quantity: a.quantity + r.quantity,
      sold: a.sold + r.sold,
      bonus: a.bonus + r.bonus,
      remaining: a.remaining + r.remaining,
      valueDistributor: a.valueDistributor + r.valueDistributor,
      valuePharmacy: a.valuePharmacy + r.valuePharmacy,
      soldValueDistributor: a.soldValueDistributor + r.soldValueDistributor,
      soldValuePharmacy: a.soldValuePharmacy + r.soldValuePharmacy,
    }),
    {
      quantity: 0,
      sold: 0,
      bonus: 0,
      remaining: 0,
      valueDistributor: 0,
      valuePharmacy: 0,
      soldValueDistributor: 0,
      soldValuePharmacy: 0,
    },
  );
  return Response.json({
    period,
    userId: scopeId,
    progress,
    totals,
    percent: totals.quantity > 0 ? Math.round((totals.sold / totals.quantity) * 100) : 0,
  });
}
/**
 * PUT /api/targets — /    
 * { userId, period, items: [{ productKey, quantity, priceDistributor, pricePharmacy }] }
 */
export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && !user.permissions.includes("users"))) {
    return Response.json({ error: " " }, { status: 401 });
  }
  const b = await req.json().catch(() => ({}));
  const userId = Number(b.userId);
  const period = String(b.period ?? "").slice(0, 7);
  if (!Number.isFinite(userId)) return Response.json({ error: " " }, { status: 400 });
  const target = (await dbRetry(() => db.select().from(users).where(eq(users.id, userId)).limit(1), "targets:user"))[0];
  if (!target) return Response.json({ error: "  " }, { status: 404 });
  const products = await getProducts();
  const items = Array.isArray(b.items) ? b.items : [];
  for (const it of items) {
    const key = String(it.productKey ?? "");
    const p = products.find((x) => x.key === key);
    if (!p) continue;
    const values = {
      userId,
      repName: target.fullName,
      period,
      productKey: key,
      productLabel: p.label,
      quantity: Math.max(0, Number(it.quantity) || 0),
      priceDistributor: Math.max(0, Number(it.priceDistributor) || 0),
      pricePharmacy: Math.max(0, Number(it.pricePharmacy) || 0),
      updatedAt: new Date(),
    };
    const existing = await dbRetrySafe(
      () =>
        db
          .select()
          .from(targets)
          .where(and(eq(targets.userId, userId), eq(targets.period, period), eq(targets.productKey, key)))
          .limit(1),
      [],
      "targets:find",
    );
    if (existing.length) {
      await dbRetry(() => db.update(targets).set(values).where(eq(targets.id, existing[0].id)), "targets:update");

    } else {
      await dbRetry(() => db.insert(targets).values(values), "targets:insert");
    }
  }
  return Response.json({ ok: true, count: items.length });
}
export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && !user.permissions.includes("users"))) {
    return Response.json({ error: " " }, { status: 401 });
  }
  const url = new URL(req.url);
  const userId = Number(url.searchParams.get("userId"));
  const period = url.searchParams.get("period") ?? "";
  if (!Number.isFinite(userId)) return Response.json({ error: " " }, { status: 400 });
  const where: SQL | undefined = and(eq(targets.userId, userId), eq(targets.period, period));
  await dbRetry(() => db.delete(targets).where(where), "targets:delete");
  return Response.json({ ok: true });
}
