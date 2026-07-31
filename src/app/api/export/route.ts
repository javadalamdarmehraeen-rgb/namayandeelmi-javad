import { db } from "@/db";
import { doctors, orders, pharmacies, trips, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { PRODUCTS } from "@/lib/constants";
import { tehranDateTime } from "@/lib/jalali";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

function csv(rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
}

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const type = new URL(req.url).searchParams.get("type") ?? "pharmacies";
  let rows: (string | number)[][] = [];
  let name = type;

  if (type === "pharmacies") {
    const data = await db.select().from(pharmacies).orderBy(desc(pharmacies.id));
    rows = [
      ["ردیف", "نام نماینده", "تاریخ ثبت", "نام داروخانه", "مسئول سفارش", "شماره همراه", "آدرس", "عرض جغرافیایی", "طول جغرافیایی", "لینک نقشه", "ارسال شده"],
      ...data.map((r, i) => [
        i + 1,
        r.repName,
        r.dateShamsi,
        r.name,
        r.managerName,
        r.managerPhone,
        r.address,
        r.lat ?? "",
        r.lng ?? "",
        r.lat && r.lng ? `https://www.google.com/maps?q=${r.lat},${r.lng}` : "",
        r.sent ? "بله" : "خیر",
      ]),
    ];
    name = "pharmacies";
  } else if (type === "doctors") {
    const data = await db.select().from(doctors).orderBy(desc(doctors.id));
    rows = [
      ["ردیف", "نام نماینده", "تاریخ ثبت", "نام پزشک", "تخصص", "شماره همراه پزشک", "نام منشی", "شماره منشی", "آدرس مطب", "آدرس مطب‌های دیگر", "لینک نقشه", "ارسال شده"],
      ...data.map((r, i) => [
        i + 1,
        r.repName,
        r.dateShamsi,
        r.name,
        r.specialty,
        r.phone,
        r.secretaryName,
        r.secretaryPhone,
        r.address,
        r.otherAddresses,
        r.lat && r.lng ? `https://www.google.com/maps?q=${r.lat},${r.lng}` : "",
        r.sent ? "بله" : "خیر",
      ]),
    ];
  } else if (type === "orders") {
    const data = await db.select().from(orders).orderBy(desc(orders.id));
    const productCols = PRODUCTS.flatMap((p) => [p.label, p.bonusLabel]);
    rows = [
      ["ردیف", "نام نماینده", "تاریخ سفارش", "نام داروخانه", "مسئول سفارش", "شماره همراه", "آدرس", ...productCols, "نام پخش", "نام ویزیتور", "توضیحات", "لینک نقشه", "وضعیت ارسال"],
      ...data.map((r, i) => [
        i + 1,
        r.repName,
        r.dateShamsi,
        r.pharmacyName,
        r.managerName,
        r.managerPhone,
        r.address,
        ...PRODUCTS.flatMap((p) => [Number(r.items?.[p.key] ?? 0), Number(r.items?.[p.bonusKey] ?? 0)]),
        r.distributor,
        r.visitor,
        r.notes,
        r.lat && r.lng ? `https://www.google.com/maps?q=${r.lat},${r.lng}` : "",
        r.sendStatus || (r.sent ? "ارسال شده" : "ارسال نشده"),
      ]),
    ];
  } else if (type === "trips") {
    const data = await db.select().from(trips).orderBy(desc(trips.id));
    rows = [
      ["ردیف", "نام نماینده", "تاریخ", "وضعیت", "شروع", "پایان"],
      ...data.map((r, i) => [
        i + 1,
        r.repName,
        r.dateShamsi,
        r.status === "active" ? "در حال ویزیت" : "پایان یافته",
        tehranDateTime(r.startedAt),
        r.endedAt ? tehranDateTime(r.endedAt) : "",
      ]),
    ];
  } else if (type === "users") {
    const data = await db.select().from(users).orderBy(desc(users.id));
    rows = [
      ["ردیف", "نام", "نام کاربری", "شماره همراه", "نقش", "وضعیت"],
      ...data.map((r, i) => [
        i + 1,
        r.fullName,
        r.username,
        r.phone,
        r.role === "admin" ? "مدیر" : "نماینده علمی",
        r.active ? "فعال" : "غیرفعال",
      ]),
    ];
  } else {
    return Response.json({ error: "نوع نامعتبر" }, { status: 400 });
  }

  return new Response(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}-${Date.now()}.csv"`,
    },
  });
}
