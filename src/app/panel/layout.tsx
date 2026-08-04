import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import Shell, { type NavItem } from "@/components/Shell";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const all: (NavItem & { perm?: string })[] = [
    { href: "/panel", label: "صفحه اصلی", icon: "🏠" },
    { href: "/panel/pharmacies", label: "ثبت داروخانه", icon: "🏥", perm: "pharmacy" },
    { href: "/panel/doctors", label: "ثبت پزشک", icon: "🩺", perm: "doctor" },
    { href: "/panel/orders", label: "ثبت سفارشات", icon: "🧾", perm: "order" },
    { href: "/panel/trip", label: "تردد و ویزیت", icon: "🗺️", perm: "trip" },
    { href: "/panel/home", label: "لوکیشن منزل", icon: "🏡", perm: "home" },
    { href: "/panel/leaves", label: "مرخصی", icon: "📝", perm: "leave" },
    { href: "/panel/options", label: "افزودن‌ها", icon: "➕", perm: "options" },
    { href: "/panel/reports", label: "گزارش ماهانه", icon: "📈", perm: "reports" },
  ];
  const nav = all
    .filter((n) => !n.perm || user.role === "admin" || user.permissions.includes(n.perm))
    .map(({ href, label, icon }) => ({ href, label, icon }));

  return (
    <Shell
      userName={user.fullName}
      roleLabel={user.role === "admin" ? "مدیر" : user.role === "supervisor" ? "سرپرست" : "نماینده علمی"}
      nav={nav}
      showAdminLink={user.role === "admin" || user.role === "supervisor"}
    >
      {children}
    </Shell>
  );
}
