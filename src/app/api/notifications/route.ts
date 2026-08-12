import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { and, desc, eq, inArray, isNull, or, sql, SQL } from "drizzle-orm";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const onlyUnread = new URL(req.url).searchParams.get("unread") === "1";
  const scope: SQL | undefined =
    user.role === "rep"
      ? or(eq(notifications.toUserId, user.id), eq(notifications.toRole, "rep"))
      : or(
          eq(notifications.toUserId, user.id),
          eq(notifications.toRole, user.role),
          and(isNull(notifications.toUserId), eq(notifications.toRole, "")),
        );
  const where = onlyUnread ? and(scope, isNull(notifications.readAt)) : scope;
  const rows = await db.select().from(notifications).where(where).orderBy(desc(notifications.id)).limit(100);
  const unread = rows.filter((r) => !r.readAt).length;
  return Response.json({ rows, unread });
}
/**  /      */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const title = String(b.title ?? "").trim().slice(0, 200);
  if (!title) return Response.json({ error: "   " }, { status: 400 });
  const body = String(b.body ?? "").slice(0, 2000);
  if (user.role === "rep") {
    await db.insert(notifications).values({
      toRole: "admin",
      fromName: user.fullName,
      kind: "message",
      title,
      body,
    });
    return Response.json({ ok: true });
  }
  const targetId = Number(b.toUserId);
  if (Number.isFinite(targetId) && targetId > 0) {
    await db
      .insert(notifications)
      .values({ toUserId: targetId, fromName: user.fullName, kind: "message", title, body });
  } else {
    const reps = await db.select({ id: users.id }).from(users).where(eq(users.role, "rep"));
    if (reps.length) {
      await db
        .insert(notifications)
        .values(reps.map((r) => ({ toUserId: r.id, fromName: user.fullName, kind: "message", title, body })));
    }
  }
  return Response.json({ ok: true });
}
/**   */

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const ids: number[] = Array.isArray(b.ids) ? b.ids.map(Number).filter(Number.isFinite) : [];
  if (b.all === true) {
    const scope: SQL | undefined =
      user.role === "rep"
        ? or(eq(notifications.toUserId, user.id), eq(notifications.toRole, "rep"))
        : or(
            eq(notifications.toUserId, user.id),
            eq(notifications.toRole, user.role),
            and(isNull(notifications.toUserId), eq(notifications.toRole, "")),
          );
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(scope, isNull(notifications.readAt)));
    return Response.json({ ok: true });
  }
  if (!ids.length) return Response.json({ error: "  " }, { status: 400 });
  await db.update(notifications).set({ readAt: new Date() }).where(inArray(notifications.id, ids));
  void sql;
  return Response.json({ ok: true });
}
