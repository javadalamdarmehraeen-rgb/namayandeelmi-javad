"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field, Input } from "@/components/ui";
import { toPersianDigits } from "@/lib/jalali";
import { patchFetch, setTabToken } from "@/components/SessionProvider";
import { cacheUser, getCachedUser } from "@/lib/offline-session";
import {
  getDeviceId,
  getDeviceInfo,
  getDeviceSim,
  isMobileDevice,
  maskPhone,
  normalizePhone,
  setDeviceSim,
  watchSim,
  type SimStatus,
} from "@/lib/device";

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
  const [forgot, setForgot] = useState(false);
  const [simMismatch, setSimMismatch] = useState("");
  const [regMask, setRegMask] = useState("");
  const [deviceBound, setDeviceBound] = useState(false);
  const [netType, setNetType] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpMsg, setOtpMsg] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpLeft, setOtpLeft] = useState(0);
  const [info, setInfo] = useState("");

  useEffect(() => {
    patchFetch();
    const saved = localStorage.getItem("sek_phone");
    if (saved) setPhone(saved);
    const stop = watchSim((s: SimStatus) => {
      setSimOk(s.ok);
      setSimWarn(s.ok ? "" : s.detail);
      setNetType(
        s.type === "cellular"
          ? "اینترنت سیم‌کارت (Cellular)"
          : s.type === "wifi"
            ? "وای‌فای"
            : s.online
              ? "متصل"
              : "قطع",
      );
    });
    return stop;
  }, []);

  // بررسی لحظه‌ای مغایرت سیم‌کارت
  useEffect(() => {
    if (mode !== "rep" || !needPhone) {
      setSimMismatch("");
      return;
    }
    const entered = normalizePhone(phone);
    if (entered.length < 11) {
      setSimMismatch("");
      return;
    }
    // ۱) مغایرت با شماره‌ای که مدیر برای این کاربر ثبت کرده
    if (regMask && maskPhone(entered) !== regMask) {
      setSimMismatch(
        `⛔ مغایرت سیم‌کارت: شماره ثبت‌شده توسط مدیر برای این کاربر «${regMask}» است، اما شما «${maskPhone(entered)}» وارد کرده‌اید. ورود فقط با سیم‌کارت ثبت‌شده مجاز است.`,
      );
      return;
    }
    // ۲) مغایرت با سیم‌کارتی که قبلاً روی همین گوشی تایید شده
    const deviceSim = getDeviceSim();
    if (deviceSim && entered !== deviceSim) {
      setSimMismatch(
        `⛔ روی این گوشی سیم‌کارت «${maskPhone(deviceSim)}» فعال و تاییدشده است. ورود با شماره دیگر مجاز نیست.`,
      );
      return;
    }
    setSimMismatch("");
  }, [phone, mode, needPhone, regMask]);

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
        setRegMask("");
        setDeviceBound(false);
        return;
      }
      setNeedPhone(Boolean(d.requirePhone));
      setRegMask(d.phoneMask ?? "");
      setDeviceBound(Boolean(d.deviceBound));
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

  const requestOtp = async () => {
    setOtpBusy(true);
    const res = await fetch("/api/auth/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request", username, password, deviceId: getDeviceId() }),
    }).catch(() => null);
    setOtpBusy(false);
    const d = await res?.json().catch(() => ({}));
    setOtpMsg(d?.message ?? d?.error ?? "ارسال کد انجام نشد");
    if (d?.ok) {
      setOtpLeft(180);
      const iv = setInterval(() => {
        setOtpLeft((v) => {
          if (v <= 1) {
            clearInterval(iv);
            return 0;
          }
          return v - 1;
        });
      }, 1000);
    }
  };

  const verifyOtp = async () => {
    if (otpCode.trim().length < 4) {
      setOtpMsg("کد تایید را کامل وارد کنید");
      return;
    }
    setOtpBusy(true);
    const res = await fetch("/api/auth/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "verify",
        username,
        password,
        code: otpCode.trim(),
        deviceId: getDeviceId(),
        deviceInfo: getDeviceInfo(),
        remember: true,
      }),
    });
    setOtpBusy(false);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setOtpMsg(d.error ?? "کد نامعتبر است");
      return;
    }
    if (d.token) setTabToken(d.token, true);
    if (d.user) cacheUser(d.user);
    if (phone) {
      localStorage.setItem("sek_phone", phone);
      setDeviceSim(normalizePhone(phone));
    }
    router.replace(d.user?.role === "rep" ? "/panel" : "/admin");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "rep" && needPhone && !simOk) {
      setError(simWarn || "⚠️ سیم‌کارت فعالی روی این گوشی شناسایی نشد.");
      return;
    }
    if (mode === "rep" && needPhone && simMismatch) {
      setError(simMismatch);
      return;
    }
    if (needPhone && !/^0\d{10}$/.test(phone.replace(/\D/g, ""))) {
      setError("⚠️ شماره همراه فعال روی این گوشی را ۱۱ رقمی وارد کنید (نمونه: ۰۹۱۲۳۴۵۶۷۸۹)");
      return;
    }
    // ورود آفلاین: اگر اینترنت نیست ولی قبلاً با همین کاربر وارد شده‌اید
    if (!navigator.onLine) {
      const cached = getCachedUser();
      if (cached && cached.username === username.trim().toLowerCase()) {
        router.replace(cached.role === "rep" ? "/panel" : "/admin");
        return;
      }
      setError("📴 اینترنت قطع است. برای اولین ورود روی این دستگاه، اتصال اینترنت لازم است.");
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
        simActiveOnDevice: simOk && !simMismatch,
        deviceSim: getDeviceSim(),
        deviceId: getDeviceId(),
        deviceInfo: getDeviceInfo(),
        isMobile: isMobileDevice(),
      }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (data.needOtp) {
        setError("");
        setOtpMsg(data.error ?? "");
        setOtpStep(true);
        requestOtp();
        return;
      }
      setError(data.error ?? "خطا در ورود");
      if (data.simError) setSimMismatch(data.error ?? "");
      return;
    }
    if (data.token) setTabToken(data.token, true);
    if (data.user) cacheUser(data.user);
    if (phone) {
      localStorage.setItem("sek_phone", phone);
      // این شماره به‌عنوان سیم‌کارت تاییدشده همین دستگاه ثبت می‌شود
      if (data.user?.role === "rep") setDeviceSim(normalizePhone(phone));
    }
    router.replace(data.user?.role === "rep" ? "/panel" : "/admin");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-teal-700 via-teal-600 to-slate-100 p-4">
      <div className="w-full max-w-md">
        {otpStep ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
            <div className="fade-in w-full max-w-sm rounded-2xl bg-white p-4">
              <h3 className="mb-1 text-sm font-black text-slate-800">🔐 تایید سیم‌کارت</h3>
              <p className="mb-3 text-[11px] leading-6 text-slate-600">
                برای اطمینان از اینکه سیم‌کارت ثبت‌شده توسط مدیر <b>واقعاً داخل همین گوشی</b> است، کد پیامک‌شده را وارد
                کنید. اگر پیامک را دریافت نکردید، یعنی سیم‌کارت در این گوشی فعال نیست.
              </p>
              {otpMsg ? (
                <div className="mb-2">
                  <Alert kind={otpMsg.includes("ارسال شد") ? "success" : "info"}>{otpMsg}</Alert>
                </div>
              ) : null}
              <Field label="کد تایید" required>
                <Input
                  inputMode="numeric"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="_ _ _ _ _"
                  className="text-center text-lg tracking-[0.5em]"
                  autoFocus
                />
              </Field>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={verifyOtp} disabled={otpBusy}>
                  {otpBusy ? "..." : "✅ تایید و ورود"}
                </Button>
                <Button variant="soft" onClick={requestOtp} disabled={otpBusy || otpLeft > 0}>
                  {otpLeft > 0 ? `ارسال مجدد (${toPersianDigits(otpLeft)})` : "🔄 ارسال مجدد کد"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setOtpStep(false);
                    setOtpCode("");
                    setOtpMsg("");
                  }}
                >
                  بازگشت
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {forgot ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
            onClick={() => setForgot(false)}
          >
            <div
              className="fade-in w-full max-w-sm rounded-2xl bg-white p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-2 text-sm font-black text-slate-800">🔑 بازیابی رمز عبور</h3>
              <p className="mb-3 text-[11px] text-slate-500">
                نام کاربری و شماره همراه خود را وارد کنید. درخواست برای مدیر سیستم ارسال می‌شود و رمز جدید به شما
                اعلام خواهد شد.
              </p>
              {info ? (
                <div className="mb-2">
                  <Alert kind="success">{info}</Alert>
                </div>
              ) : null}
              <div className="space-y-2">
                <Field label="نام کاربری" required>
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} className="text-left" />
                </Field>
                <Field label="شماره همراه">
                  <Input
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  />
                </Field>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  onClick={async () => {
                    const res = await fetch("/api/auth/forgot", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ username, phone }),
                    });
                    const d = await res.json().catch(() => ({}));
                    setInfo(d.message ?? d.error ?? "ارسال شد");
                  }}
                >
                  ارسال درخواست
                </Button>
                <Button variant="ghost" onClick={() => setForgot(false)}>
                  بستن
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mb-4 text-center text-white">
          <div className="mx-auto mb-3 flex size-24 items-center justify-center rounded-[1.75rem] bg-white shadow-xl ring-4 ring-white/25">
            {/* لوگوی رسمی کپسول برنامه */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="لوگوی کپسول ثبت اطلاعات کل"
              width="82"
              height="82"
              className="size-[82px] object-contain drop-shadow-sm"
            />
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
          {mode === "rep" && simMismatch ? <Alert kind="error">{simMismatch}</Alert> : null}
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

          {mode === "rep" && needPhone ? (
            <div
              className={`rounded-xl px-3 py-2 text-[11px] font-bold ring-1 ${
                simMismatch
                  ? "bg-rose-50 text-rose-800 ring-rose-300"
                  : !simOk
                    ? "bg-amber-50 text-amber-800 ring-amber-300"
                    : "bg-emerald-50 text-emerald-800 ring-emerald-200"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span>{simMismatch ? "⛔" : simOk ? "✅" : "⚠️"} وضعیت سیم‌کارت این دستگاه</span>
                {netType ? <span className="rounded bg-white/70 px-2 py-0.5">شبکه: {netType}</span> : null}
                {regMask ? <span className="rounded bg-white/70 px-2 py-0.5">شماره مجاز: {regMask}</span> : null}
                {deviceBound ? <span className="rounded bg-white/70 px-2 py-0.5">🔒 متصل به یک گوشی</span> : null}
              </div>
              {!simMismatch && simOk ? (
                <div className="mt-1 font-normal">
                  ورود فقط با گوشی حاوی سیم‌کارت ثبت‌شده توسط مدیر امکان‌پذیر است.
                </div>
              ) : null}
            </div>
          ) : null}

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

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setForgot(true);
                setInfo("");
              }}
              className="text-[11px] font-bold text-teal-700 underline"
            >
              🔑 رمز عبور را فراموش کرده‌ام
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <input
              type="checkbox"
              className="size-4 accent-teal-600"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            مرا به خاطر بسپار (در غیر این صورت هر تب جدید نیاز به ورود مجدد دارد)
          </label>

          <Button type="submit" disabled={busy || (mode === "rep" && needPhone && !!simMismatch)} className="w-full">
            {busy ? "در حال ورود..." : mode === "admin" ? "🔐 ورود به داشبورد مدیر" : "🚀 ورود به پنل نماینده"}
          </Button>

          <div className="pt-1 text-center">
            <a href="/diagnostics" className="text-[11px] font-bold text-teal-700 underline">
              🩺 مشکل در ورود یا اینترنت؟ عیب‌یابی کنید
            </a>
          </div>

          <p className="pt-1 text-center text-[11px] leading-5 text-slate-400">
            مدیر: admin / admin1234 — سرپرست: sarparast / sar1234 — نماینده: rep1 / rep1234
          </p>
        </form>
      </div>
    </main>
  );
}
