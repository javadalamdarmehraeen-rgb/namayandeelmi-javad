"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field, Input } from "@/components/ui";

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"rep" | "admin">("rep");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [warn, setWarn] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sek_phone");
    if (saved) setPhone(saved);
    // آگاه‌سازی درباره وضعیت سیم‌کارت/شبکه دستگاه
    const check = () => {
      type NavConn = { type?: string; effectiveType?: string };
      const conn = (navigator as Navigator & { connection?: NavConn }).connection;
      if (!navigator.onLine) {
        setWarn("⚠️ دستگاه شما آفلاین است. برای ورود، اتصال شبکه سیم‌کارت یا اینترنت را فعال کنید.");
      } else if (conn?.type && conn.type !== "cellular" && conn.type !== "wifi") {
        setWarn("⚠️ اتصال شبکه دستگاه نامشخص است. از فعال بودن سیم‌کارت ثبت‌شده روی این گوشی مطمئن شوید.");
      } else {
        setWarn("");
      }
    };
    check();
    window.addEventListener("online", check);
    window.addEventListener("offline", check);
    return () => {
      window.removeEventListener("online", check);
      window.removeEventListener("offline", check);
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^0\d{10}$/.test(phone.replace(/\D/g, ""))) {
      setError("⚠️ شماره همراه فعال روی این گوشی را به صورت ۱۱ رقمی وارد کنید (نمونه: ۰۹۱۲۳۴۵۶۷۸۹)");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, phone, simActive: navigator.onLine }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "خطا در ورود");
      return;
    }
    localStorage.setItem("sek_phone", phone);
    router.replace(data.user?.role === "admin" ? "/admin" : "/panel");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-teal-700 via-teal-600 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-5 text-center text-white">
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-2xl bg-white/15 text-3xl ring-1 ring-white/30">
            📋
          </div>
          <h1 className="text-2xl font-black">ثبت اطلاعات کل</h1>
          <p className="mt-1 text-sm text-teal-50/90">سامانه نمایندگان علمی — وب، ویندوز و موبایل</p>
        </div>

        <form onSubmit={submit} className="space-y-3 rounded-3xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode("rep")}
              className={`flex-1 rounded-lg py-2 ${mode === "rep" ? "bg-teal-600 text-white" : "text-slate-600"}`}
            >
              ورود نماینده علمی
            </button>
            <button
              type="button"
              onClick={() => setMode("admin")}
              className={`flex-1 rounded-lg py-2 ${mode === "admin" ? "bg-slate-800 text-white" : "text-slate-600"}`}
            >
              ورود مدیر
            </button>
          </div>

          {warn ? <Alert kind="error">{warn}</Alert> : null}
          {error ? <Alert kind="error">{error}</Alert> : null}

          <Field label="نام کاربری" required>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" autoComplete="username" />
          </Field>
          <Field label="رمز عبور" required>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Field>
          <Field label="شماره همراه فعال روی این گوشی" required hint="باید با شماره ثبت‌شده توسط مدیر یکسان باشد">
            <Input
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 11))}
              placeholder="09xxxxxxxxx"
            />
          </Field>

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "در حال ورود..." : mode === "admin" ? "🔐 ورود به داشبورد مدیر" : "🚀 ورود به پنل نماینده"}
          </Button>

          <p className="pt-1 text-center text-[11px] leading-5 text-slate-400">
            دسترسی پیش‌فرض مدیر: admin / admin1234
            <br />
            شماره همراه پیش‌فرض مدیر: 09120000000
          </p>
        </form>
      </div>
    </main>
  );
}
