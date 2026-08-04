import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { doctors, orders, pharmacies } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { toPersianDigits, todayJalali } from "@/lib/jalali";

export const dynamic = "force-dynamic";

export default async function PanelHome() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  let counts = { ph: 0, dr: 0, or: 0 };
  try {
    const [row] = await db
      .select({
        ph: sql<number>`(select count(*) from pharmacies where user_id = ${user.id})`,
        dr: sql<number>`(select count(*) from doctors where user_id = ${user.id})`,
        or: sql<number>`(select count(*) from orders where user_id = ${user.id})`,
      })
      .from(sql`(select 1) as t`);
    counts = { ph: Number(row?.ph ?? 0), dr: Number(row?.dr ?? 0), or: Number(row?.or ?? 0) };
  } catch {
    /* ignore */
  }
  void pharmacies;
  void doctors;
  void orders;
  void eq;

  const has = (p: string) => user.role === "admin" || user.permissions.includes(p);

  const main = [
    {
      href: "/panel/pharmacies",
      title: "ثبت اطلاعات داروخانه",
      icon: "🏥",
      count: `${toPersianDigits(counts.ph)} رکورد`,
      perm: "pharmacy",
      color: "from-teal-600 to-teal-500",
    },
    {
      href: "/panel/doctors",
      title: "ثبت اطلاعات پزشک",
      icon: "🩺",
      count: `${toPersianDigits(counts.dr)} رکورد`,
      perm: "doctor",
      color: "from-sky-600 to-sky-500",
    },
    {
      href: "/panel/orders",
      title: "ثبت سفارشات داروخانه",
      icon: "🧾",
      count: `${toPersianDigits(counts.or)} رکورد`,
      perm: "order",
      color: "from-indigo-600 to-indigo-500",
    },
  ].filter((c) => has(c.perm));

  const more = [
    { href: "/panel/trip", title: "تردد و ویزیت روی نقشه", icon: "🗺️", perm: "trip" },
    { href: "/panel/home", title: "ثبت لوکیشن منزل", icon: "🏡", perm: "home" },
    { href: "/panel/leaves", title: "درخواست مرخصی", icon: "📝", perm: "leave" },
    { href: "/panel/options", title: "افزودن مقادیر کشویی", icon: "➕", perm: "options" },
    { href: "/panel/reports", title: "گزارش ماهانه من", icon: "📈", perm: "reports" },
  ].filter((c) => has(c.perm));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-lg font-black text-slate-800">سلام {user.fullName} 👋</h1>
        <p className="mt-1 text-sm text-slate-500">امروز {toPersianDigits(todayJalali())}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {main.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`flex items-center gap-4 rounded-2xl bg-gradient-to-l ${c.color} p-4 text-white shadow-md transition active:scale-[0.99]`}
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl">
              {c.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black">{c.title}</span>
              <span className="mt-0.5 block text-[11px] text-white/85">{c.count}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {more.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-200 hover:ring-teal-300"
          >
            <span className="text-2xl">{c.icon}</span>
            <span className="text-xs font-bold text-slate-700">{c.title}</span>
          </Link>
        ))}
      </div>

      {main.length + more.length === 0 ? (
        <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
          هنوز هیچ دسترسی برای شما تعریف نشده است. لطفاً با مدیر سیستم تماس بگیرید.
        </div>
      ) : null}
    </div>
  );
}
