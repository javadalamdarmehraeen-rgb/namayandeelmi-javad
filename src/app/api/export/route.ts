import { db } from "@/db";
import { attachments, doctors, homes, leaves, orders, pharmacies, trips, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { bonusKeyOf } from "@/lib/defaults";
import { getProducts } from "@/lib/settings-server";
import { xlsResponse } from "@/lib/excel";
import { tehranDateTime } from "@/lib/jalali";
import { desc, eq, SQL } from "drizzle-orm";

export const dynamic = "force-dynamic";

const mapLink = (lat: number | null, lng: number | null) =>
  lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : "";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "pharmacies";
  const month = url.searchParams.get("month") ?? "";
  const year = url.searchParams.get("year") ?? "";
  const isAdmin = user.role === "admin" || user.role === "supervisor";

  const inPeriod = (d: string) => {
    if (year && !d.startsWith(year)) return false;
    if (month && d.slice(5, 7) !== month.padStart(2, "0")) return false;
    return true;
  };

  const PRODUCTS = await getProducts();
  let rows: (string | number)[][] = [];
  let name = type;

  if (type === "pharmacies") {
    const w: SQL | undefined = isAdmin ? undefined : eq(pharmacies.userId, user.id);
    const data = (await db.select().from(pharmacies).where(w).orderBy(desc(pharmacies.id))).filter((r) =>
      inPeriod(r.dateShamsi),
    );
    rows = [
      ["ردیف", "نام نماینده", "تاریخ ثبت", "استان", "شهر", "منطقه", "نام داروخانه", "شماره ثابت", "مسئول سفارش", "شماره همراه", "آدرس", "درصدی؟", "میزان درصد", "لینک نقشه", "دقت (متر)", "ارسال شده"],
      ...data.map((r, i) => [
        i + 1,
        r.repName,
        r.dateShamsi,
        r.province,
        r.city,
        r.region,
        r.name,
        r.landline,
        r.managerName,
        r.managerPhone,
        r.address,
        r.isPercent ? "بله" : "خیر",
        r.percentValue,
        mapLink(r.lat, r.lng),
        r.accuracy ? Math.round(r.accuracy) : "",
        r.sent ? "بله" : "خیر",
      ]),
    ];
    name = "pharmacies";
  } else if (type === "doctors") {
    const w: SQL | undefined = isAdmin ? undefined : eq(doctors.userId, user.id);
    const data = (await db.select().from(doctors).where(w).orderBy(desc(doctors.id))).filter((r) =>
      inPeriod(r.dateShamsi),
    );
    const fileCount = new Map<number, number>();
    try {
      const atts = await db
        .select({ ownerId: attachments.ownerId })
        .from(attachments)
        .where(eq(attachments.ownerType, "doctor"));
      for (const a of atts) if (a.ownerId) fileCount.set(a.ownerId, (fileCount.get(a.ownerId) ?? 0) + 1);
    } catch {
      /* ignore */
    }
    rows = [
      ["ردیف", "نام نماینده", "تاریخ ثبت", "استان", "شهر", "منطقه", "نام پزشک", "تخصص", "شماره همراه پزشک", "نام منشی", "شماره منشی", "آدرس مطب", "آدرس مطب‌های دیگر", "درصدی؟", "میزان درصد", "تعداد فایل", "لینک نقشه", "ارسال شده"],
      ...data.map((r, i) => [
        i + 1,
        r.repName,
        r.dateShamsi,
        r.province,
        r.city,
        r.region,
        r.name,
        r.specialty,
        r.phone,
        r.secretaryName,
        r.secretaryPhone,
        r.address,
        r.otherAddresses,
        r.isPercent ? "بله" : "خیر",
        r.percentValue,
        fileCount.get(r.id) ?? 0,
        mapLink(r.lat, r.lng),
        r.sent ? "بله" : "خیر",
      ]),
    ];
  } else if (type === "orders") {
    const w: SQL | undefined = isAdmin ? undefined : eq(orders.userId, user.id);
    const data = (await db.select().from(orders).where(w).orderBy(desc(orders.id))).filter((r) =>
      inPeriod(r.dateShamsi),
    );
    rows = [
      [
        "ردیف",
        "نام نماینده",
        "تاریخ سفارش",
        "نام داروخانه",
        "مسئول سفارش",
        "شماره همراه",
        "آدرس",
        ...PRODUCTS.flatMap((p) => [p.label, p.bonusLabel]),
        "نام پخش",
        "نام ویزیتور",
        "توضیحات",
        "لینک نقشه",
        "وضعیت ارسال",
      ],
      ...data.map((r, i) => [
        i + 1,
        r.repName,
        r.dateShamsi,
        r.pharmacyName,
        r.managerName,
        r.managerPhone,
        r.address,
        ...PRODUCTS.flatMap((p) => [Number(r.items?.[p.key] ?? 0), Number(r.items?.[bonusKeyOf(p.key)] ?? 0)]),
        r.distributor,
        r.visitor,
        r.notes,
        mapLink(r.lat, r.lng),
        r.sendStatus || (r.sent ? "ارسال شده" : "ارسال نشده"),
      ]),
    ];
  } else if (type === "trips") {
    const w: SQL | undefined = isAdmin ? undefined : eq(trips.userId, user.id);
    const data = await db.select().from(trips).where(w).orderBy(desc(trips.id));
    rows = [
      ["ردیف", "نام نماینده", "تاریخ", "وضعیت", "شروع", "پایان", "مسافت (کیلومتر)", "مدت توقف (دقیقه)"],
      ...data.map((r, i) => [
        i + 1,
        r.repName,
        r.dateShamsi,
        r.status === "active" ? "در حال ویزیت" : "پایان یافته",
        tehranDateTime(r.startedAt),
        r.endedAt ? tehranDateTime(r.endedAt) : "",
        ((r.distanceM ?? 0) / 1000).toFixed(2),
        Math.round((r.stopSeconds ?? 0) / 60),
      ]),
    ];
  } else if (type === "leaves") {
    const w: SQL | undefined = isAdmin ? undefined : eq(leaves.userId, user.id);
    const data = await db.select().from(leaves).where(w).orderBy(desc(leaves.id));
    const fa = (s: string) => (s === "approved" ? "تایید" : s === "rejected" ? "رد" : "در انتظار");
    rows = [
      ["ردیف", "نام نماینده", "نوع", "از تاریخ", "تا تاریخ", "تعداد روز", "از ساعت", "تا ساعت", "مدت (ساعت)", "علت", "تایید سرپرست", "تایید مدیر"],
      ...data.map((r, i) => [
        i + 1,
        r.repName,
        r.kind,
        r.fromDate,
        r.toDate,
        r.days,
        r.fromTime,
        r.toTime,
        r.hours,
        r.reason,
        fa(r.supervisorStatus),
        fa(r.managerStatus),
      ]),
    ];
  } else if (type === "homes") {
    if (!isAdmin) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    const data = await db.select().from(homes).orderBy(desc(homes.id));
    rows = [
      ["ردیف", "نام نماینده", "عنوان", "آدرس", "لینک نقشه"],
      ...data.map((r, i) => [i + 1, r.repName, r.title, r.address, mapLink(r.lat, r.lng)]),
    ];
  } else if (type === "users") {
    if (user.role !== "admin") return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    const data = await db.select().from(users).orderBy(desc(users.id));
    rows = [
      ["ردیف", "نام", "نام کاربری", "رمز عبور", "شماره همراه", "نقش", "وضعیت"],
      ...data.map((r, i) => [
        i + 1,
        r.fullName,
        r.username,
        r.passwordPlain,
        r.phone,
        r.role === "admin" ? "مدیر" : r.role === "supervisor" ? "سرپرست" : "نماینده علمی",
        r.active ? "فعال" : "غیرفعال",
      ]),
    ];
  } else {
    return Response.json({ error: "نوع نامعتبر" }, { status: 400 });
  }

  return xlsResponse(`${name}-${Date.now()}`, name, rows);
}
