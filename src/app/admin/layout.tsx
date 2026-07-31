import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import Shell from "@/components/Shell";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/panel");

  const nav = [
    { href: "/admin", label: "داشبورد", icon: "📊" },
    { href: "/admin/records/pharmacies", label: "داروخانه‌ها", icon: "🏥" },
    { href: "/admin/records/doctors", label: "پزشکان", icon: "🩺" },
    { href: "/admin/records/orders", label: "سفارشات", icon: "🧾" },
    { href: "/admin/trips", label: "رصد تردد", icon: "🗺️" },
    { href: "/admin/users", label: "نمایندگان و دسترسی", icon: "👤" },
    { href: "/admin/options", label: "لیست‌های کشویی", icon: "🧩" },
    { href: "/admin/messengers", label: "پیام‌رسان‌ها", icon: "📨" },
  ];

  return (
    <Shell userName={user.fullName} roleLabel="مدیر سیستم" nav={nav}>
      {children}
    </Shell>
  );
}
