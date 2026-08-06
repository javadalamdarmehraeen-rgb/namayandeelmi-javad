"use client";

import type { ReactNode } from "react";
import Shell, { type NavItem } from "@/components/Shell";
import SessionProvider, { useSession } from "@/components/SessionProvider";

function Inner({ children }: { children: ReactNode }) {
  const { me } = useSession();
  if (!me) return null;
  const has = (p: string) => me.role === "admin" || me.permissions.includes(p);

  const all: (NavItem & { perm?: string })[] = [
    { href: "/panel", label: "صفحه اصلی", icon: "🏠" },
    { href: "/panel/pharmacies", label: "ثبت داروخانه", icon: "🏥", perm: "pharmacy" },
    { href: "/panel/doctors", label: "ثبت پزشک", icon: "🩺", perm: "doctor" },
    { href: "/panel/orders", label: "ثبت سفارشات", icon: "🧾", perm: "order" },
    { href: "/panel/trip", label: "تردد و ویزیت", icon: "🗺️", perm: "trip" },
    { href: "/panel/home", label: "لوکیشن منزل", icon: "🏡", perm: "home" },
    { href: "/panel/leaves", label: "مرخصی", icon: "📝", perm: "leave" },
    { href: "/panel/notifications", label: "اعلان‌ها", icon: "🔔" },
    { href: "/panel/options", label: "افزودن‌ها", icon: "➕", perm: "options" },
    { href: "/panel/reports", label: "گزارش ماهانه", icon: "📈", perm: "reports" },
    { href: "/install", label: "نصب اپ", icon: "📲" },
    { href: "/diagnostics", label: "عیب‌یابی", icon: "🩺" },
  ];
  const nav = all.filter((n) => !n.perm || has(n.perm)).map(({ href, label, icon }) => ({ href, label, icon }));

  return (
    <Shell
      userName={me.fullName}
      roleLabel={me.role === "admin" ? "مدیر" : me.role === "supervisor" ? "سرپرست" : "نماینده علمی"}
      nav={nav}
      showAdminLink={me.role !== "rep"}
    >
      {children}
    </Shell>
  );
}

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider require>
      <Inner>{children}</Inner>
    </SessionProvider>
  );
}
