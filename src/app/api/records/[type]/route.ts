import { db, dbRetry } from "@/db";
import { activityLogs, attachments, doctors, orders, pharmacies, settings } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { and, desc, eq, inArray, SQL } from "drizzle-orm";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ type: string }> };
const num = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n !== 0 ? n : null;
};
const str = (v: unknown, max = 0) => {
  const t = String(v ?? "").trim();
  return max > 0 ? t.slice(0, max) : t; // max=0    
};
export async function GET(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
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
      const rows = await dbRetry(
        () => db.select().from(pharmacies).where(w).orderBy(desc(pharmacies.id)).limit(limit),
        "pharmacies:list",
      );
      return Response.json({ rows });
    }
    if (type === "doctors") {
      const w: SQL | undefined = !isAdmin
        ? eq(doctors.userId, user.id)
        : userIdFilter
          ? eq(doctors.userId, Number(userIdFilter))
          : undefined;
      const rows = await dbRetry(
        () => db.select().from(doctors).where(w).orderBy(desc(doctors.id)).limit(limit),
        "doctors:list",
      );
      return Response.json({ rows });
    }
    if (type === "orders") {
      const w: SQL | undefined = !isAdmin
        ? eq(orders.userId, user.id)
        : userIdFilter
          ? eq(orders.userId, Number(userIdFilter))
          : undefined;
      const rows = await dbRetry(
        () => db.select().from(orders).where(w).orderBy(desc(orders.id)).limit(limit),
        "orders:list",

      );
      return Response.json({ rows });
    }
  } catch {
    return Response.json({ error: "   " }, { status: 500 });
  }
  return Response.json({ error: " " }, { status: 400 });
}
export async function POST(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const { type } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const base = {
    userId: user.id,
    repName: user.fullName,
    dateShamsi: str(body.dateShamsi, 12),
    lat: num(body.lat),
    lng: num(body.lng),
    accuracy: num(body.accuracy),
    locationLabel: str(body.locationLabel),
  };
  try {
    if (type === "pharmacies") {
      if (!base.dateShamsi || !str(body.name)) {
        return Response.json({ error: "     " }, { status: 400 });
      }
      const [row] = await dbRetry(() =>
        db
        .insert(pharmacies)
        .values({
          ...base,
          province: str(body.province, 100),
          city: str(body.city, 100),
          region: str(body.region, 100),
          name: str(body.name),
          landline: str(body.landline, 20),
          managerName: str(body.managerName, 160),
          managerPhone: str(body.managerPhone, 20),
          address: str(body.address),
          isPercent: body.isPercent === true,
          percentValue: str(body.percentValue),
          locationLabel: base.locationLabel || str(body.name),
        })
        .returning(),
        "pharmacies:create",
      );
      const phFiles: number[] = Array.isArray(body.fileIds)
        ? body.fileIds.map(Number).filter((n: number) => Number.isFinite(n))
        : [];
      if (phFiles.length) {
        await db
          .update(attachments)
          .set({ ownerId: row.id })
          .where(and(inArray(attachments.id, phFiles), eq(attachments.userId, user.id)));
      }
      await log(user.id, user.fullName, " ", str(body.name));
      return Response.json({ row });
    }
    if (type === "doctors") {
      if (!base.dateShamsi || !str(body.name)) {
        return Response.json({ error: "     " }, { status: 400 });
      }
      const [row] = await db
        .insert(doctors)
        .values({
          ...base,
          province: str(body.province, 100),
          city: str(body.city, 100),
          region: str(body.region, 100),
          name: str(body.name),
          specialty: str(body.specialty, 160),
          phone: str(body.phone, 20),
          secretaryName: str(body.secretaryName, 160),
          secretaryPhone: str(body.secretaryPhone, 20),
          address: str(body.address),
          otherAddresses: str(body.otherAddresses),
          isPercent: body.isPercent === true,
          percentValue: str(body.percentValue),
          locationLabel: base.locationLabel || str(body.name),
        })
        .returning();
      const fileIds: number[] = Array.isArray(body.fileIds)

        ? body.fileIds.map(Number).filter((n: number) => Number.isFinite(n))
        : [];
      if (fileIds.length) {
        await db
          .update(attachments)
          .set({ ownerId: row.id })
          .where(and(inArray(attachments.id, fileIds), eq(attachments.userId, user.id)));
      }
      await log(user.id, user.fullName, " ", str(body.name));
      return Response.json({ row });
    }
    if (type === "orders") {
      if (!base.dateShamsi || !str(body.pharmacyName)) {
        return Response.json({ error: "     " }, { status: 400 });
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
          pharmacyName: str(body.pharmacyName),
          managerName: str(body.managerName, 160),
          managerPhone: str(body.managerPhone, 20),
          address: str(body.address),
          locationLabel: base.locationLabel || str(body.pharmacyName),
          items,
          distributor: str(body.distributor, 160),
          visitor: str(body.visitor, 160),
          notes: str(body.notes),
        })
        .returning();
      await log(user.id, user.fullName, " ", str(body.pharmacyName));
      //      (  —    )
      const autoSend = await getAutoSend();
      if (autoSend) {
        void (async () => {
          try {
            const { dispatchOrder } = await import("@/lib/messaging");
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
            await db.update(orders).set({ sendStatus: status, sent: true }).where(eq(orders.id, row.id));
            const { notify } = await import("@/lib/notify");
            await notify({
              toRole: "admin",
              fromName: row.repName,
              kind: "order",
              title: `    ${row.repName}`,
              body: `${row.pharmacyName} — ${status}`,
              link: "/admin/records/orders",
            });
          } catch (err) {
            console.error("[order:autosend]", err instanceof Error ? err.message : err);
          }
        })();
      }
      return Response.json({ row, autoSend });
    }
  } catch {
    return Response.json({ error: "   " }, { status: 500 });
  }
  return Response.json({ error: " " }, { status: 400 });
}
/**         (: ) */
async function getAutoSend(): Promise<boolean> {
  try {

    const rows = await db.select().from(settings).where(eq(settings.key, "autoSendOrders")).limit(1);
    const v = rows[0]?.value as { enabled?: boolean } | boolean | undefined;
    if (typeof v === "boolean") return v;
    if (v && typeof v === "object" && typeof v.enabled === "boolean") return v.enabled;
  } catch {
    /* ignore */
  }
  return true;
}
async function log(userId: number, userName: string, action: string, detail: string) {
  try {
    await db.insert(activityLogs).values({ userId, userName, action, detail });
  } catch {
    /* ignore */
  }
}
/**   —       */
export async function PATCH(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const { type } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isFinite(id)) return Response.json({ error: " " }, { status: 400 });
  const isAdmin = user.role === "admin" || user.role === "supervisor";
  const patch: Record<string, unknown> = {};
  const setIf = (key: string, val: unknown) => {
    if (val !== undefined) patch[key] = val;
  };
  try {
    if (type === "pharmacies") {
      setIf("dateShamsi", body.dateShamsi ? str(body.dateShamsi, 12) : undefined);
      setIf("province", body.province !== undefined ? str(body.province, 100) : undefined);
      setIf("city", body.city !== undefined ? str(body.city, 100) : undefined);
      setIf("region", body.region !== undefined ? str(body.region, 100) : undefined);
      setIf("name", body.name !== undefined ? str(body.name) : undefined);
      setIf("landline", body.landline !== undefined ? str(body.landline, 20) : undefined);
      setIf("managerName", body.managerName !== undefined ? str(body.managerName, 160) : undefined);
      setIf("managerPhone", body.managerPhone !== undefined ? str(body.managerPhone, 20) : undefined);
      setIf("address", body.address !== undefined ? str(body.address) : undefined);
      setIf("isPercent", typeof body.isPercent === "boolean" ? body.isPercent : undefined);
      setIf("percentValue", body.percentValue !== undefined ? str(body.percentValue) : undefined);
      setIf("lat", body.lat !== undefined ? num(body.lat) : undefined);
      setIf("lng", body.lng !== undefined ? num(body.lng) : undefined);
      if (Object.keys(patch).length === 0) return Response.json({ error: "  " }, { status: 400 });
      const w = isAdmin ? eq(pharmacies.id, id) : and(eq(pharmacies.id, id), eq(pharmacies.userId, user.id));
      await dbRetry(() => db.update(pharmacies).set(patch).where(w), "pharmacies:update");
    } else if (type === "doctors") {
      setIf("dateShamsi", body.dateShamsi ? str(body.dateShamsi, 12) : undefined);
      setIf("province", body.province !== undefined ? str(body.province, 100) : undefined);
      setIf("city", body.city !== undefined ? str(body.city, 100) : undefined);
      setIf("region", body.region !== undefined ? str(body.region, 100) : undefined);
      setIf("name", body.name !== undefined ? str(body.name) : undefined);
      setIf("specialty", body.specialty !== undefined ? str(body.specialty, 160) : undefined);
      setIf("phone", body.phone !== undefined ? str(body.phone, 20) : undefined);
      setIf("secretaryName", body.secretaryName !== undefined ? str(body.secretaryName, 160) : undefined);
      setIf("secretaryPhone", body.secretaryPhone !== undefined ? str(body.secretaryPhone, 20) : undefined);
      setIf("address", body.address !== undefined ? str(body.address) : undefined);
      setIf("otherAddresses", body.otherAddresses !== undefined ? str(body.otherAddresses) : undefined);
      setIf("isPercent", typeof body.isPercent === "boolean" ? body.isPercent : undefined);
      setIf("percentValue", body.percentValue !== undefined ? str(body.percentValue) : undefined);
      setIf("lat", body.lat !== undefined ? num(body.lat) : undefined);
      setIf("lng", body.lng !== undefined ? num(body.lng) : undefined);
      if (Object.keys(patch).length === 0) return Response.json({ error: "  " }, { status: 400 });
      const w = isAdmin ? eq(doctors.id, id) : and(eq(doctors.id, id), eq(doctors.userId, user.id));
      await dbRetry(() => db.update(doctors).set(patch).where(w), "doctors:update");
    } else if (type === "orders") {
      setIf("dateShamsi", body.dateShamsi ? str(body.dateShamsi, 12) : undefined);
      setIf("pharmacyName", body.pharmacyName !== undefined ? str(body.pharmacyName) : undefined);
      setIf("managerName", body.managerName !== undefined ? str(body.managerName, 160) : undefined);
      setIf("managerPhone", body.managerPhone !== undefined ? str(body.managerPhone, 20) : undefined);
      setIf("address", body.address !== undefined ? str(body.address) : undefined);
      setIf("distributor", body.distributor !== undefined ? str(body.distributor, 160) : undefined);
      setIf("visitor", body.visitor !== undefined ? str(body.visitor, 160) : undefined);
      setIf("notes", body.notes !== undefined ? str(body.notes) : undefined);
      setIf("lat", body.lat !== undefined ? num(body.lat) : undefined);
      setIf("lng", body.lng !== undefined ? num(body.lng) : undefined);
      if (body.items && typeof body.items === "object") {
        const items: Record<string, number> = {};
        for (const [k, v] of Object.entries(body.items as Record<string, unknown>)) {
          const n = Number(v);

          if (Number.isFinite(n) && n !== 0) items[k] = n;
        }
        patch.items = items;
      }
      if (Object.keys(patch).length === 0) return Response.json({ error: "  " }, { status: 400 });
      const w = isAdmin ? eq(orders.id, id) : and(eq(orders.id, id), eq(orders.userId, user.id));
      await dbRetry(() => db.update(orders).set(patch).where(w), "orders:update");
    } else {
      return Response.json({ error: " " }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "  " }, { status: 500 });
  }
  await log(user.id, user.fullName, " ", `${type} #${id}`);
  return Response.json({ ok: true });
}
/**   */
export async function DELETE(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const { type } = await ctx.params;
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isFinite(id)) return Response.json({ error: " " }, { status: 400 });
  const isAdmin = user.role === "admin" || user.role === "supervisor";
  const perm = type === "pharmacies" ? "pharmacy.delete" : type === "doctors" ? "doctor.delete" : "order.delete";
  if (!isAdmin && !user.permissions.includes(perm)) {
    return Response.json({ error: "   .    ." }, { status: 403 });
  }
  try {
    if (type === "pharmacies") {
      const w = isAdmin ? eq(pharmacies.id, id) : and(eq(pharmacies.id, id), eq(pharmacies.userId, user.id));
      await dbRetry(() => db.delete(pharmacies).where(w), "pharmacies:delete");
    } else if (type === "doctors") {
      const w = isAdmin ? eq(doctors.id, id) : and(eq(doctors.id, id), eq(doctors.userId, user.id));
      await dbRetry(() => db.delete(doctors).where(w), "doctors:delete");
    } else if (type === "orders") {
      const w = isAdmin ? eq(orders.id, id) : and(eq(orders.id, id), eq(orders.userId, user.id));
      await dbRetry(() => db.delete(orders).where(w), "orders:delete");
    } else {
      return Response.json({ error: " " }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "  " }, { status: 500 });
  }
  await log(user.id, user.fullName, " ", `${type} #${id}`);
  return Response.json({ ok: true });
}
