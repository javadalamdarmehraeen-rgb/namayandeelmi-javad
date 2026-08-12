"use client";
import type { ReactNode } from "react";
import Shell, { type NavItem } from "@/components/Shell";
import SessionProvider, { useSession } from "@/components/SessionProvider";
function Inner({ children }: { children: ReactNode }) {
  const { me } = useSession();
  if (!me) return null;
  const has = (p: string) => me.role === "admin" || me.permissions.includes(p);
  const all: (NavItem & { perm?: string })[] = [
    { href: "/panel", label: " ", icon: "" },
    { href: "/panel/pharmacies", label: " ", icon: "", perm: "pharmacy" },
    { href: "/panel/doctors", label: " ", icon: "", perm: "doctor" },
    { href: "/panel/orders", label: " ", icon: "", perm: "order" },
    { href: "/panel/trip", label: "  ", icon: "", perm: "trip" },
    { href: "/panel/map", label: " ", icon: "" },
    { href: "/panel/home", label: " ", icon: "", perm: "home" },
    { href: "/panel/leaves", label: "", icon: "", perm: "leave" },
    { href: "/panel/notifications", label: "", icon: "" },
    { href: "/panel/options", label: "", icon: "", perm: "options" },
    { href: "/panel/reports", label: " ", icon: "", perm: "reports" },
    { href: "/install", label: " ", icon: "" },
    { href: "/diagnostics", label: "", icon: "" },
  ];
  const nav = all.filter((n) => !n.perm || has(n.perm)).map(({ href, label, icon }) => ({ href, label, icon }));
  return (
    <Shell
      userName={me.fullName}
      roleLabel={me.role === "admin" ? "" : me.role === "supervisor" ? "" : " "}
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
