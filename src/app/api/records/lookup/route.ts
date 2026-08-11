import { db, dbRetrySafe } from "@/db";
import { doctors, orders, pharmacies } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { bonusKeyOf } from "@/lib/defaults";
import { getProducts } from "@/lib/settings-server";
import { desc } from "drizzle-orm";
export const dynamic = "force-dynamic";
/**    :    «» «»    */
export function normalizeName(input: string) {
  return String(input ?? "")
    .replace(/[\u200c\u200f\u200e]/g, "")
    .replace(/[]/g, "")
    .replace(//g, "")
    .replace(/[]/g, "")
    .replace(//g, "")
    .replace(/^(||||)\s*/g, "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}
function normPhone(p: string) {
  return String(p ?? "").replace(/\D/g, "");
}
/**
 * GET /api/records/lookup?type=pharmacies|doctors|orders&name=...&phone=...
 *
 *  :

 *  )      / 
 *  )         
 */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "pharmacies";
  const rawName = url.searchParams.get("name") ?? "";
  const phone = normPhone(url.searchParams.get("phone") ?? "");
  const key = normalizeName(rawName);
  if (key.length < 2 && !phone) return Response.json({ duplicates: [], suggestion: null });
  /* --------  :  -------- */
  if (type === "doctors") {
    const rows = await dbRetrySafe(
      () => db.select().from(doctors).orderBy(desc(doctors.id)).limit(3000),
      [],
      "lookup:doctors",
    );
    const dup = rows.filter(
      (r) => (key.length >= 2 && normalizeName(r.name) === key) || (!!phone && normPhone(r.phone) === phone),
    );
    return Response.json({
      duplicates: dup.slice(0, 5).map((r) => ({
        id: r.id,
        name: r.name,
        specialty: r.specialty,
        phone: r.phone,
        city: r.city,
        address: r.address,
        repName: r.repName,
        dateShamsi: r.dateShamsi,
        mine: r.userId === user.id,
      })),
      count: dup.length,
    });
  }
  /* -------- :  +   -------- */
  const phRows = await dbRetrySafe(
    () => db.select().from(pharmacies).orderBy(desc(pharmacies.id)).limit(3000),
    [],
    "lookup:pharmacies",
  );
  const dup = phRows.filter(
    (r) => (key.length >= 2 && normalizeName(r.name) === key) || (!!phone && normPhone(r.managerPhone) === phone),
  );
  const duplicates = dup.slice(0, 5).map((r) => ({
    id: r.id,
    name: r.name,
    province: r.province,
    city: r.city,
    region: r.region,
    landline: r.landline,
    managerName: r.managerName,
    managerPhone: r.managerPhone,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    accuracy: r.accuracy,
    isPercent: r.isPercent,
    percentValue: r.percentValue,
    repName: r.repName,
    dateShamsi: r.dateShamsi,
    mine: r.userId === user.id,
  }));
  if (type !== "orders") return Response.json({ duplicates, count: dup.length });
  /* --------     -------- */
  const orderRows = await dbRetrySafe(
    () => db.select().from(orders).orderBy(desc(orders.id)).limit(3000),
    [],
    "lookup:orders",
  );
  const history = orderRows.filter((o) => normalizeName(o.pharmacyName) === key);
  const products = await getProducts();
  const itemTotals: Record<string, { label: string; qty: number; bonus: number }> = {};
  for (const o of history) {
    for (const p of products) {

      const q = Number(o.items?.[p.key] ?? 0);
      const bn = Number(o.items?.[bonusKeyOf(p.key)] ?? 0);
      if (!q && !bn) continue;
      itemTotals[p.key] ??= { label: p.label, qty: 0, bonus: 0 };
      itemTotals[p.key].qty += q;
      itemTotals[p.key].bonus += bn;
    }
  }
  const last = history[0] ?? null;
  const base = duplicates[0] ?? null;
  //         (   )
  const suggestion =
    last || base
      ? {
          source: last ? "order" : "pharmacy",
          pharmacyName: last?.pharmacyName ?? base?.name ?? rawName,
          managerName: last?.managerName || base?.managerName || "",
          managerPhone: last?.managerPhone || base?.managerPhone || "",
          address: last?.address || base?.address || "",
          lat: last?.lat ?? base?.lat ?? null,
          lng: last?.lng ?? base?.lng ?? null,
          accuracy: last?.accuracy ?? base?.accuracy ?? null,
          distributor: last?.distributor ?? "",
          visitor: last?.visitor ?? "",
        }
      : null;
  return Response.json({
    duplicates,
    count: dup.length,
    history: {
      orderCount: history.length,
      lastDate: last?.dateShamsi ?? "",
      lastRep: last?.repName ?? "",
      totalUnits: Object.values(itemTotals).reduce((a, x) => a + x.qty, 0),
      totalBonus: Object.values(itemTotals).reduce((a, x) => a + x.bonus, 0),
      items: Object.entries(itemTotals).map(([k, v]) => ({ key: k, ...v })),
      recent: history.slice(0, 5).map((o) => ({
        id: o.id,
        dateShamsi: o.dateShamsi,
        repName: o.repName,
        units: products.reduce((a, p) => a + Number(o.items?.[p.key] ?? 0), 0),
      })),
    },
    suggestion,
  });
}
