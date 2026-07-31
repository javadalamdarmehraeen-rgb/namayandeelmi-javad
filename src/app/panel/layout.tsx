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
    { href: "/panel/pharmacies", label: "ثبت اطلاعات داروخانه", icon: "🏥", perm: "pharmacy" },
    { href: "/panel/doctors", label: "ثبت اطلاعات پزشک", icon: "🩺", perm: "doctor" },
    { href: "/panel/orders", label: "ثبت سفارشات داروخانه", icon: "🧾", perm: "order" },
    { href: "/panel/trip", label: "تردد و ویزیت", icon: "🗺️", perm: "trip" },
  ];
  const nav = all
    .filter((n) => !n.perm || user.permissions.includes(n.perm) || user.role === "admin")
    .map(({ href, label, icon }) => ({ href, label, icon }));

  return (
    <Shell userName={user.fullName} roleLabel={user.role === "admin" ? "مدیر" : "نماینده علمی"} nav={nav}>
      {children}
    </Shell>
  );
}
