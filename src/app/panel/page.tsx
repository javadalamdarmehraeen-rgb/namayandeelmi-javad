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
    const [ph] = await db
      .select({ c: sql<number>`count(*)` })
      .from(pharmacies)
      .where(eq(pharmacies.userId, user.id));
    const [dr] = await db
      .select({ c: sql<number>`count(*)` })
      .from(doctors)
      .where(eq(doctors.userId, user.id));
    const [or] = await db
      .select({ c: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.userId, user.id));
    counts = { ph: Number(ph?.c ?? 0), dr: Number(dr?.c ?? 0), or: Number(or?.c ?? 0) };
  } catch {
    /* ignore */
  }

  const cards = [
    {
      href: "/panel/pharmacies",
      title: "ثبت اطلاعات داروخانه",
      icon: "🏥",
      count: counts.ph,
      perm: "pharmacy",
      color: "from-teal-600 to-teal-500",
    },
    {
      href: "/panel/doctors",
      title: "ثبت اطلاعات پزشک",
      icon: "🩺",
      count: counts.dr,
      perm: "doctor",
      color: "from-sky-600 to-sky-500",
    },
    {
      href: "/panel/orders",
      title: "ثبت سفارشات داروخانه",
      icon: "🧾",
      count: counts.or,
      perm: "order",
      color: "from-indigo-600 to-indigo-500",
    },
  ].filter((c) => user.permissions.includes(c.perm) || user.role === "admin");

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-lg font-black text-slate-800">سلام {user.fullName} 👋</h1>
        <p className="mt-1 text-sm text-slate-500">
          امروز {toPersianDigits(todayJalali())} — یکی از گزینه‌های زیر را انتخاب کنید.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`group flex items-center gap-4 rounded-2xl bg-gradient-to-l ${c.color} p-5 text-white shadow-md transition hover:scale-[1.01] active:scale-[0.99]`}
          >
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl">
              {c.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-base font-black">{c.title}</span>
              <span className="mt-1 block text-xs text-white/85">
                {toPersianDigits(c.count)} رکورد ثبت‌شده توسط شما
              </span>
            </span>
          </Link>
        ))}
      </div>

      {user.permissions.includes("trip") || user.role === "admin" ? (
        <Link
          href="/panel/trip"
          className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-teal-300"
        >
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-3xl">🗺️</span>
          <span>
            <span className="block text-base font-black text-slate-800">ثبت تردد و ویزیت روی نقشه</span>
            <span className="mt-1 block text-xs text-slate-500">
              شروع ویزیت، ثبت وقفه، پایان سفر — با پشتیبانی آنلاین و آفلاین
            </span>
          </span>
        </Link>
      ) : null}
    </div>
  );
}
