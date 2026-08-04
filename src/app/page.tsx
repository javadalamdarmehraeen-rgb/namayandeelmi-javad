"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { patchFetch } from "@/components/SessionProvider";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    patchFetch();
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => router.replace(!d?.user ? "/login" : d.user.role === "rep" ? "/panel" : "/admin"))
      .catch(() => router.replace("/login"));
  }, [router]);
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">
      در حال بارگذاری...
    </main>
  );
}
