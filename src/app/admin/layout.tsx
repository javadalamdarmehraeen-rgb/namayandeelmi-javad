"use client";

import type { ReactNode } from "react";
import Shell from "@/components/Shell";
import SessionProvider, { useSession } from "@/components/SessionProvider";

function Inner({ children }: { children: ReactNode }) {
  const { me } = useSession();
  if (!me) return null;
  const has = (p: string) => me.role === "admin" || me.permissions.includes(p);

  const nav = [
    { href: "/admin", label: "داشبورد", icon: "📊", perm: "dashboard" },
    { href: "/admin/records/pharmacies", label: "داروخانه‌ها", icon: "🏥", perm: "pharmacy" },
    { href: "/admin/records/doctors", label: "پزشکان", icon: "🩺", perm: "doctor" },
    { href: "/admin/records/orders", label: "سفارشات", icon: "🧾", perm: "order" },
    { href: "/admin/activity", label: "فعالیت لحظه‌ای", icon: "🕒", perm: "dashboard" },
    { href: "/admin/map", label: "نقشه جامع", icon: "🧭", perm: "map.viewAll" },
    { href: "/admin/live", label: "موقعیت زنده", icon: "📍", perm: "live" },
    { href: "/admin/trips", label: "رصد تردد", icon: "🗺️", perm: "monitor" },
    { href: "/admin/homes", label: "منزل نمایندگان", icon: "🏡", perm: "home" },
    { href: "/admin/leaves", label: "مرخصی‌ها", icon: "📝", perm: "leave" },
    { href: "/admin/notifications", label: "اعلان‌ها", icon: "🔔" },
    { href: "/admin/reports", label: "گزارش ماهانه", icon: "📈", perm: "reports" },
    { href: "/admin/targets", label: "تارگت فروش", icon: "🎯", perm: "targets.manage" },
    { href: "/admin/options", label: "افزودن‌ها", icon: "➕", perm: "options" },
    { href: "/admin/columns", label: "ستون‌ها و کالاها", icon: "🧱", perm: "columns" },
    { href: "/admin/users", label: "کاربران و دسترسی", icon: "👤", perm: "users" },
    { href: "/admin/messengers", label: "پیام‌رسان‌ها", icon: "📨", perm: "messengers" },
    { href: "/admin/backup", label: "پشتیبان‌گیری", icon: "💾", perm: "backup" },
    { href: "/admin/sync", label: "همگام‌سازی سرورها", icon: "🔄", perm: "sync" },
    { href: "/install", label: "نصب اپ", icon: "📲" },
    { href: "/diagnostics", label: "عیب‌یابی", icon: "🩺" },
  ]
    .filter((n) => !n.perm || has(n.perm))
    .map(({ href, label, icon }) => ({ href, label, icon }));

  return (
    <Shell
      userName={me.fullName}
      roleLabel={me.role === "admin" ? "مدیر سیستم" : "سرپرست"}
      nav={nav}
      showPanelLink
    >
      {children}
    </Shell>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider require adminOnly>
      <Inner>{children}</Inner>
    </SessionProvider>
  );
}
