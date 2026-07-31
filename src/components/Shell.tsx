"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export type NavItem = { href: string; label: string; icon: string };

export default function Shell({
  userName,
  roleLabel,
  nav,
  children,
}: {
  userName: string;
  roleLabel: string;
  nav: NavItem[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const set = () => setOnline(navigator.onLine);
    set();
    window.addEventListener("online", set);
    window.addEventListener("offline", set);
    return () => {
      window.removeEventListener("online", set);
      window.removeEventListener("offline", set);
    };
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-30 bg-gradient-to-l from-teal-700 to-teal-600 text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-3 sm:px-5">
          <button className="rounded-lg bg-white/15 px-2 py-1 text-lg lg:hidden" onClick={() => setOpen((v) => !v)}>
            ☰
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="text-xl">📋</span>
            <div className="min-w-0">
              <div className="truncate text-sm font-black sm:text-base">ثبت اطلاعات کل</div>
              <div className="truncate text-[11px] text-teal-50/80">
                {roleLabel}: {userName}
              </div>
            </div>
          </div>
          <span
            className={`rounded-lg px-2 py-1 text-[10px] font-bold ${
              online ? "bg-emerald-400/20 text-emerald-50" : "bg-amber-400/25 text-amber-50"
            }`}
          >
            {online ? "آنلاین" : "آفلاین"}
          </span>
          <button onClick={logout} className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25">
            خروج
          </button>
        </div>
        <nav className={`${open ? "block" : "hidden"} border-t border-white/10 lg:block`}>
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-3 py-2 lg:flex-row lg:items-center lg:gap-2 lg:px-5">
            {nav.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                    active ? "bg-white text-teal-700" : "text-teal-50 hover:bg-white/15"
                  }`}
                >
                  <span className="ml-1">{n.icon}</span>
                  {n.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl p-3 sm:p-5">{children}</main>
      <footer className="pb-6 text-center text-[11px] text-slate-400">
        نسخه سبک وب‌اپلیکیشن — قابل نصب روی ویندوز و موبایل
      </footer>
    </div>
  );
}
