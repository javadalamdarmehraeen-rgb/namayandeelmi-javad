"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import dynamic from "next/dynamic";
const TargetPanel = dynamic(() => import("@/components/screens/TargetPanel"), { ssr: false });
const ChartsPanel = dynamic(() => import("@/components/screens/ChartsPanel"), {
  ssr: false,
  loading: () => <div className="rounded-2xl bg-white p-6 text-center text-xs text-slate-400">   ..
.</div>,
});
import { toPersianDigits, todayJalali } from "@/lib/jalali";
export default function PanelHome() {
  const { me } = useSession();
  const [counts, setCounts] = useState({ ph: 0, dr: 0, or: 0 });
  useEffect(() => {
    fetch("/api/reports", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const rows = (d?.rows ?? []) as { pharmacies: number; doctors: number; orders: number }[];
        setCounts({
          ph: rows.reduce((a, r) => a + r.pharmacies, 0),
          dr: rows.reduce((a, r) => a + r.doctors, 0),
          or: rows.reduce((a, r) => a + r.orders, 0),
        });
      })
      .catch(() => undefined);
  }, []);
  if (!me) return null;
  const has = (p: string) => me.role === "admin" || me.permissions.includes(p);
  const main = [
    { href: "/panel/pharmacies", title: "  ", icon: "", n: counts.ph, perm: "pharmacy", color: "from
-teal-600 to-teal-500" },
    { href: "/panel/doctors", title: "  ", icon: "", n: counts.dr, perm: "doctor", color: "from-sky-600 
to-sky-500" },
    { href: "/panel/orders", title: "  ", icon: "", n: counts.or, perm: "order", color: "from-indigo
-600 to-indigo-500" },
  ].filter((c) => has(c.perm));
  const more = [
    { href: "/panel/trip", title: "  ", icon: "", perm: "trip" },
    { href: "/panel/home", title: " ", icon: "", perm: "home" },
    { href: "/panel/leaves", title: " ", icon: "", perm: "leave" },
    { href: "/panel/notifications", title: "", icon: "", perm: "" },
    { href: "/panel/options", title: " ", icon: "", perm: "options" },
    { href: "/panel/reports", title: " ", icon: "", perm: "reports" },
  ].filter((c) => !c.perm || has(c.perm));
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-lg font-black text-slate-800"> {me.fullName} </h1>
        <p className="mt-1 text-sm text-slate-500"> {toPersianDigits(todayJalali())}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {main.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`flex items-center gap-4 rounded-2xl bg-gradient-to-l ${c.color} p-4 text-white shadow-md active:
scale-[0.99]`}
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl">
              {c.icon}

            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black">{c.title}</span>
              <span className="mt-0.5 block text-[11px] text-white/85">{toPersianDigits(c.n)} </span>
            </span>
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {more.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate
-200 hover:ring-teal-300"
          >
            <span className="text-2xl">{c.icon}</span>
            <span className="text-xs font-bold text-slate-700">{c.title}</span>
          </Link>
        ))}
      </div>
      {has("order") ? <TargetPanel /> : null}
      {has("reports") ? <ChartsPanel scope="rep" /> : null}
      {main.length + more.length === 0 ? (
        <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
                .     .
        </div>
      ) : null}
    </div>
  );
}
