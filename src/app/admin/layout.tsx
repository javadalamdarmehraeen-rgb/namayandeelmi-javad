"use client";
import type { ReactNode } from "react";
import Shell from "@/components/Shell";
import SessionProvider, { useSession } from "@/components/SessionProvider";
function Inner({ children }: { children: ReactNode }) {
  const { me } = useSession();
  if (!me) return null;
  const has = (p: string) => me.role === "admin" || me.permissions.includes(p);
  const nav = [
    { href: "/admin", label: "", icon: "", perm: "dashboard" },
    { href: "/admin/records/pharmacies", label: "", icon: "", perm: "pharmacy" },
    { href: "/admin/records/doctors", label: "", icon: "", perm: "doctor" },
    { href: "/admin/records/orders", label: "", icon: "", perm: "order" },
    { href: "/admin/activity", label: " ", icon: "", perm: "dashboard" },
    { href: "/admin/map", label: " ", icon: "", perm: "monitor" },
    { href: "/admin/live", label: " ", icon: "", perm: "monitor" },

    { href: "/admin/trips", label: " ", icon: "", perm: "monitor" },
    { href: "/admin/homes", label: " ", icon: "", perm: "home" },
    { href: "/admin/leaves", label: "", icon: "", perm: "leave" },
    { href: "/admin/notifications", label: "", icon: "" },
    { href: "/admin/reports", label: " ", icon: "", perm: "reports" },
    { href: "/admin/targets", label: " ", icon: "", perm: "users" },
    { href: "/admin/options", label: "", icon: "", perm: "options" },
    { href: "/admin/columns", label: "  ", icon: "", perm: "columns" },
    { href: "/admin/users", label: "  ", icon: "", perm: "users" },
    { href: "/admin/messengers", label: "", icon: "", perm: "messengers" },
    { href: "/admin/backup", label: "", icon: "", perm: "users" },
    { href: "/admin/sync", label: " ", icon: "", perm: "users" },
    { href: "/install", label: " ", icon: "" },
    { href: "/diagnostics", label: "", icon: "" },
  ]
    .filter((n) => !n.perm || has(n.perm))
    .map(({ href, label, icon }) => ({ href, label, icon }));
  return (
    <Shell
      userName={me.fullName}
      roleLabel={me.role === "admin" ? " " : ""}
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
