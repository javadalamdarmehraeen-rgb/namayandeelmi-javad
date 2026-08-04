"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field, Input } from "@/components/ui";
import { patchFetch, setTabToken } from "@/components/SessionProvider";

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"rep" | "admin">("rep");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [phone, setPhone] = useState("");
  const [needPhone, setNeedPhone] = useState(true);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const [busy, setBusy] = useState(false);
  const [simOk, setSimOk] = useState(true);
  const [simWarn, setSimWarn] = useState("");

  useEffect(() => {
    patchFetch();
    const saved = localStorage.getItem("sek_phone");
    if (saved) setPhone(saved);

    // بررسی فعال بودن شبکه سیم‌کارت روی همین گوشی
    const check = () => {
      type Conn = { type?: string; effectiveType?: string; downlink?: number };
      const nav = navigator as Navigator & { connection?: Conn };
      const conn = nav.connection;
      if (!navigator.onLine) {
        setSimOk(false);
        setSimWarn("⚠️ این دستگاه به شبکه متصل نیست. سیم‌کارت ثبت‌شده را فعال کنید.");
        return;
      }
      // در موبایل اگر نوع اتصال مشخص و غیر از cellular/wifi بود هشدار می‌دهیم
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile && conn?.type && !["cellular", "wifi", "unknown"].includes(conn.type)) {
        setSimOk(false);
        setSimWarn("⚠️ اتصال سیم‌کارت روی این گوشی فعال نیست.");
        return;
      }
      setSimOk(true);
      setSimWarn("");
    };
    check();
    window.addEventListener("online", check);
    window.addEventListener("offline", check);
    return () => {
      window.removeEventListener("online", check);
      window.removeEventListener("offline", check);
    };
  }, []);

  // با تایپ نام کاربری، تب صحیح و نیاز به شماره همراه تشخیص داده می‌شود
  useEffect(() => {
    const u = username.trim();
    if (u.length < 2) {
      setHint("");
      setNeedPhone(true);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch("/api/auth/check-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u }),
      }).catch(() => null);
      if (!res?.ok) return;
      const d = await res.json();
      if (!d.exists) {
        setHint("");
        setNeedPhone(true);
        return;
      }
      setNeedPhone(Boolean(d.requirePhone));
      if (d.kind !== mode) {
        setHint(
          d.kind === "admin"
            ? "این حساب مدیر/سرپرست است — لطفاً تب «ورود مدیر» را انتخاب کنید."
            : "این حساب نماینده علمی است — لطفاً تب «ورود نماینده علمی» را انتخاب کنید.",
        );
      } else setHint("");
    }, 400);
    return () => clearTimeout(t);
  }, [username, mode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "rep" && needPhone && !simOk) {
      setError(simWarn || "⚠️ سیم‌کارت فعالی روی این گوشی شناسایی نشد.");
      return;
    }
    if (needPhone && !/^0\d{10}$/.test(phone.replace(/\D/g, ""))) {
      setError("⚠️ شماره همراه فعال روی این گوشی را ۱۱ رقمی وارد کنید (نمونه: ۰۹۱۲۳۴۵۶۷۸۹)");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        phone,
        mode,
        remember,
        simActive: navigator.onLine,
        simActiveOnDevice: simOk,
      }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "خطا در ورود");
      return;
    }
    if (data.token) setTabToken(data.token);
    if (phone) localStorage.setItem("sek_phone", phone);
    router.replace(data.user?.role === "rep" ? "/panel" : "/admin");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-teal-700 via-teal-600 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-4 text-center text-white">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-white/15 text-2xl ring-1 ring-white/30">
            📋
          </div>
          <h1 className="text-2xl font-black">ثبت اطلاعات کل</h1>
          <p className="mt-1 text-xs text-teal-50/90">سامانه نمایندگان علمی — وب، ویندوز و موبایل</p>
        </div>

        <form onSubmit={submit} className="space-y-3 rounded-3xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode("rep");
                setUsername("");
                setPassword("");
                setError("");
              }}
              className={`flex-1 rounded-lg py-2 ${mode === "rep" ? "bg-teal-600 text-white" : "text-slate-600"}`}
            >
              👨‍⚕️ ورود نماینده علمی
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("admin");
                setUsername("");
                setPassword("");
                setError("");
              }}
              className={`flex-1 rounded-lg py-2 ${mode === "admin" ? "bg-slate-800 text-white" : "text-slate-600"}`}
            >
              🔐 ورود مدیر / سرپرست
            </button>
          </div>

          {mode === "rep" && simWarn ? <Alert kind="error">{simWarn}</Alert> : null}
          {hint ? <Alert kind="info">{hint}</Alert> : null}
          {error ? <Alert kind="error">{error}</Alert> : null}

          <Field label="نام کاربری" required>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={mode === "admin" ? "نام کاربری مدیر" : "نام کاربری نماینده"}
              autoComplete="off"
            />
          </Field>

          <Field label="رمز عبور" required>
            <div className="relative">
              <Input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="off"
                className="pl-12"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg bg-slate-100 px-2 py-1 text-xs"
                title={showPass ? "پنهان کردن رمز" : "نمایش رمز"}
              >
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
          </Field>

          {needPhone ? (
            <Field label="شماره همراه فعال روی این گوشی" required hint="در صورت غیرفعال بودن توسط مدیر، نمایش داده نمی‌شود">
              <Input
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 11))}
                placeholder="09xxxxxxxxx"
              />
            </Field>
          ) : (
            <Alert kind="info">برای این کاربر ورود بدون شماره همراه فعال شده است.</Alert>
          )}

          <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <input
              type="checkbox"
              className="size-4 accent-teal-600"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            مرا به خاطر بسپار (در غیر این صورت هر تب جدید نیاز به ورود مجدد دارد)
          </label>

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "در حال ورود..." : mode === "admin" ? "🔐 ورود به داشبورد مدیر" : "🚀 ورود به پنل نماینده"}
          </Button>

          <p className="pt-1 text-center text-[11px] leading-5 text-slate-400">
            مدیر: admin / admin1234 — سرپرست: sarparast / sar1234 — نماینده: rep1 / rep1234
          </p>
        </form>
      </div>
    </main>
  );
}
