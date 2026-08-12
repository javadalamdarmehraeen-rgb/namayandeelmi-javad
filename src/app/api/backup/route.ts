import { db } from "@/db";
import {
  activityLogs,
  attachments,
  doctors,
  homes,
  leaves,
  messengers,
  notifications,
  options,
  orders,

  roles,
  pharmacies,
  settings,
  tripPoints,
  trips,
  users,
} from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { todayJalali } from "@/lib/jalali";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return Response.json({ error: " " }, { status: 401 });
  const withFiles = new URL(req.url).searchParams.get("files") === "1";
  const [
    usersRows,
    pharmaciesRows,
    doctorsRows,
    ordersRows,
    optionsRows,
    homesRows,
    leavesRows,
    tripsRows,
    tripPointsRows,
    messengersRows,
    notificationsRows,
    settingsRows,
    activityRows,
    rolesRows,
  ] = await Promise.all([
    db.select().from(users),
    db.select().from(pharmacies),
    db.select().from(doctors),
    db.select().from(orders),
    db.select().from(options),
    db.select().from(homes),
    db.select().from(leaves),
    db.select().from(trips),
    db.select().from(tripPoints),
    db.select().from(messengers),
    db.select().from(notifications),
    db.select().from(settings),
    db.select().from(activityLogs),
    db.select().from(roles),
  ]);
  const files = withFiles
    ? await db.select().from(attachments)
    : await db
        .select({
          id: attachments.id,
          ownerType: attachments.ownerType,
          ownerId: attachments.ownerId,
          fileName: attachments.fileName,
          mimeType: attachments.mimeType,
          size: attachments.size,
        })
        .from(attachments);
  const payload = {
    app: "sabt-etelaat-kol",
    version: 1,
    createdAt: new Date().toISOString(),
    dateShamsi: todayJalali(),
    includesFiles: withFiles,
    counts: {
      users: usersRows.length,
      pharmacies: pharmaciesRows.length,
      doctors: doctorsRows.length,
      orders: ordersRows.length,
      trips: tripsRows.length,
      leaves: leavesRows.length,
      attachments: files.length,
    },
    data: {
      users: usersRows,
      pharmacies: pharmaciesRows,
      doctors: doctorsRows,
      orders: ordersRows,
      options: optionsRows,
      homes: homesRows,
      leaves: leavesRows,

      trips: tripsRows,
      tripPoints: tripPointsRows,
      messengers: messengersRows,
      notifications: notificationsRows,
      settings: settingsRows,
      roles: rolesRows,
      activityLogs: activityRows,
      attachments: files,
    },
  };
  const stamp = todayJalali().replace(/\//g, "-");
  const time = new Date().toISOString().slice(11, 16).replace(":", "");
  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="namayandeelmi-backup-${stamp}-${time}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
