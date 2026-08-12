import { db, dbRetry } from "@/db";
import { doctors, orders, pharmacies, trips } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { bonusKeyOf } from "@/lib/defaults";
import { getProducts } from "@/lib/settings-server";
import { eq, SQL } from "drizzle-orm";
export const dynamic = "force-dynamic";
export type MonthlyRow = {
  period: string; // 1405/03
  repName: string;
  pharmacies: number;
  doctors: number;
  orders: number;
  units: number;
  bonus: number;
  trips: number;
};
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const url = new URL(req.url);
  const isAdmin = user.role === "admin" || user.role === "supervisor";
  const repFilter = url.searchParams.get("userId");
  const scopeId = isAdmin ? (repFilter ? Number(repFilter) : null) : user.id;
  const wP: SQL | undefined = scopeId ? eq(pharmacies.userId, scopeId) : undefined;
  const wD: SQL | undefined = scopeId ? eq(doctors.userId, scopeId) : undefined;
  const wO: SQL | undefined = scopeId ? eq(orders.userId, scopeId) : undefined;
  const wT: SQL | undefined = scopeId ? eq(trips.userId, scopeId) : undefined;
  const PRODUCTS = await getProducts();
  const [ph, dr, or, tr] = await dbRetry(() => Promise.all([
    db
      .select({ d: pharmacies.dateShamsi, rep: pharmacies.repName })
      .from(pharmacies)
      .where(wP)
      .limit(5000),
    db.select({ d: doctors.dateShamsi, rep: doctors.repName }).from(doctors).where(wD).limit(5000),
    db
      .select({ d: orders.dateShamsi, rep: orders.repName, items: orders.items })
      .from(orders)
      .where(wO)
      .limit(5000),
    db.select({ d: trips.dateShamsi, rep: trips.repName }).from(trips).where(wT).limit(5000),
  ]), "reports:load");
  const map = new Map<string, MonthlyRow>();
  const key = (d: string, rep: string) => `${d.slice(0, 7)}|${rep}`;
  const get = (d: string, rep: string) => {
    const k = key(d, rep);
    let row = map.get(k);
    if (!row) {
      row = {
        period: d.slice(0, 7),
        repName: rep,
        pharmacies: 0,
        doctors: 0,
        orders: 0,
        units: 0,
        bonus: 0,
        trips: 0,
      };
      map.set(k, row);
    }
    return row;
  };
  for (const r of ph) get(r.d, r.rep).pharmacies++;
  for (const r of dr) get(r.d, r.rep).doctors++;
  for (const r of tr) get(r.d, r.rep).trips++;
  for (const r of or) {
    const row = get(r.d, r.rep);
    row.orders++;
    for (const p of PRODUCTS) {
      row.units += Number(r.items?.[p.key] ?? 0);
      row.bonus += Number(r.items?.[bonusKeyOf(p.key)] ?? 0);
    }
  }
  const rows = [...map.values()].sort((a, b) =>

    a.period === b.period ? a.repName.localeCompare(b.repName) : b.period.localeCompare(a.period),
  );
  //   :     
  const productTotals: Record<string, Record<string, number>> = {};
  const productByRep: {
    period: string;
    repName: string;
    items: Record<string, number>;
    bonuses: Record<string, number>;
  }[] = [];
  const idx = new Map<string, number>();
  for (const r of or) {
    const per = r.d.slice(0, 7);
    productTotals[per] ??= {};
    const k = `${per}|${r.rep}`;
    let i = idx.get(k);
    if (i === undefined) {
      i = productByRep.length;
      idx.set(k, i);
      productByRep.push({ period: per, repName: r.rep, items: {}, bonuses: {} });
    }
    for (const p of PRODUCTS) {
      const q = Number(r.items?.[p.key] ?? 0);
      const b = Number(r.items?.[bonusKeyOf(p.key)] ?? 0);
      productTotals[per][p.key] = (productTotals[per][p.key] ?? 0) + q;
      productByRep[i].items[p.key] = (productByRep[i].items[p.key] ?? 0) + q;
      productByRep[i].bonuses[p.key] = (productByRep[i].bonuses[p.key] ?? 0) + b;
    }
  }
  productByRep.sort((a, b) =>
    a.period === b.period ? a.repName.localeCompare(b.repName) : b.period.localeCompare(a.period),
  );
  return Response.json({ rows, productTotals, productByRep });
}
