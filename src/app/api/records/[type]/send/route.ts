import { db } from "@/db";

import { activityLogs, doctors, orders, pharmacies } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { dispatchOrder } from "@/lib/messaging";
import { notify } from "@/lib/notify";
import { eq, inArray, and } from "drizzle-orm";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ type: string }> };
export async function POST(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const { type } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const ids: number[] = Array.isArray(body.ids)
    ? body.ids.map((v: unknown) => Number(v)).filter((n: number) => Number.isFinite(n))
    : [];
  if (ids.length === 0) return Response.json({ error: "   " }, { status: 400 });
  let sendStatusText = "";
  try {
    if (type === "pharmacies") {
      await db
        .update(pharmacies)
        .set({ sent: true })
        .where(and(inArray(pharmacies.id, ids), eq(pharmacies.userId, user.id)));
    } else if (type === "doctors") {
      await db
        .update(doctors)
        .set({ sent: true })
        .where(and(inArray(doctors.id, ids), eq(doctors.userId, user.id)));
    } else if (type === "orders") {
      const rows = await db
        .select()
        .from(orders)
        .where(and(inArray(orders.id, ids), eq(orders.userId, user.id)));
      let lastStatus = "";
      for (const row of rows) {
        const status = await dispatchOrder({
          id: row.id,
          repName: row.repName,
          dateShamsi: row.dateShamsi,
          pharmacyName: row.pharmacyName,
          managerName: row.managerName,
          managerPhone: row.managerPhone,
          address: row.address,
          lat: row.lat,
          lng: row.lng,
          items: row.items ?? {},
          distributor: row.distributor,
          visitor: row.visitor,
          notes: row.notes,
        });
        lastStatus = status;
        await db.update(orders).set({ sent: true, sendStatus: status }).where(eq(orders.id, row.id));
      }
      sendStatusText = lastStatus;
    } else {
      return Response.json({ error: " " }, { status: 400 });
    }
    await db.insert(activityLogs).values({
      userId: user.id,
      userName: user.fullName,
      action: " ",
      detail: `${type} - ${ids.length} `,
    });
    const typeLabel = type === "pharmacies" ? "" : type === "doctors" ? "" : "";
    await notify({
      toRole: "admin",
      fromName: user.fullName,
      kind: "record",
      title: ` ${ids.length}  ${typeLabel}   ${user.fullName}`,
      body: sendStatusText || ` ${typeLabel}        .`,
      link: `/admin/records/${type}`,
    });
    await notify({
      toRole: "supervisor",
      fromName: user.fullName,
      kind: "record",
      title: ` ${ids.length}  ${typeLabel}   ${user.fullName}`,
      link: `/admin/records/${type}`,
    });
    return Response.json({ ok: true, count: ids.length, status: sendStatusText });
  } catch {

    return Response.json({ error: "   " }, { status: 500 });
  }
}
