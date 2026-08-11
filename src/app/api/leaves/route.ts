import { db } from "@/db";
import { activityLogs, leaves } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { isValidJalali } from "@/lib/jalali";
import { notify } from "@/lib/notify";
import { desc, eq } from "drizzle-orm";
export const dynamic = "force-dynamic";
export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const isAdmin = user.role === "admin" || user.role === "supervisor";
  const rows = isAdmin
    ? await db.select().from(leaves).orderBy(desc(leaves.id)).limit(500)
    : await db.select().from(leaves).where(eq(leaves.userId, user.id)).orderBy(desc(leaves.id)).limit(200);
  return Response.json({ rows, role: user.role });
}
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const fromDate = String(b.fromDate ?? "").trim();
  const toDate = String(b.toDate ?? "").trim();
  if (!isValidJalali(fromDate) || !isValidJalali(toDate)) {
    return Response.json({ error: "   " }, { status: 400 });
  }
  const [row] = await db
    .insert(leaves)
    .values({
      userId: user.id,
      repName: user.fullName,
      kind: String(b.kind ?? "").slice(0, 30),
      fromDate,
      toDate,
      days: Math.max(0, Number(b.days) || 0),
      fromTime: String(b.fromTime ?? "").slice(0, 5),
      toTime: String(b.toTime ?? "").slice(0, 5),
      hours: Math.max(0, Number(b.hours) || 0),
      reason: String(b.reason ?? ""),
    })
    .returning();
  await db
    .insert(activityLogs)

    .values({
      userId: user.id,
      userName: user.fullName,
      action: " ",
      detail: `${fromDate}  ${toDate}`,
    })
    .catch(() => undefined);
  for (const role of ["admin", "supervisor"] as const) {
    await notify({
      toRole: role,
      fromName: user.fullName,
      kind: "leave",
      title: `     ${user.fullName}`,
      body: ` ${fromDate}  ${toDate} — ${row.kind}${row.reason ? ` | ${row.reason}` : ""}`,
      link: "/admin/leaves",
    });
  }
  return Response.json({ row });
}
export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  if (user.role !== "admin" && user.role !== "supervisor") {
    return Response.json({ error: "      " }, { status: 403 });
  }
  const b = await req.json().catch(() => ({}));
  const id = Number(b.id);
  const status = b.status === "approved" ? "approved" : b.status === "rejected" ? "rejected" : null;
  if (!Number.isFinite(id) || !status) return Response.json({ error: " " }, { status: 400 });
  const note = String(b.note ?? "");
  const patch =
    user.role === "supervisor"
      ? { supervisorStatus: status, supervisorNote: note, supervisorName: user.fullName }
      : { managerStatus: status, managerNote: note, managerName: user.fullName };
  const target = (await db.select().from(leaves).where(eq(leaves.id, id)).limit(1))[0];
  await db.update(leaves).set(patch).where(eq(leaves.id, id));
  if (target) {
    await notify({
      toUserId: target.userId,
      fromName: user.fullName,
      kind: "leave",
      title: `${status === "approved" ? "" : ""}    ${user.role === "supervisor" ? "" : ""} ${
status === "approved" ? "" : ""} `,
      body: `${target.fromDate}  ${target.toDate}${note ? ` — ${note}` : ""}`,
      link: "/panel/leaves",
    });
  }
  await db
    .insert(activityLogs)
    .values({
      userId: user.id,
      userName: user.fullName,
      action: user.role === "supervisor" ? "/ " : "/ ",
      detail: ` #${id} → ${status === "approved" ? "" : ""}`,
    })
    .catch(() => undefined);
  return Response.json({ ok: true });
}
