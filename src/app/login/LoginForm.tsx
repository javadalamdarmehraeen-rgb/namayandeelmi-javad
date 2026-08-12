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
          ? "  (Cellular)"
          : s.type === "wifi"
            ? ""
            : s.online
              ? ""
              : "",
      );
    });
    return stop;
  }, []);
  //    
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
    // )          
    if (regMask && maskPhone(entered) !== regMask) {
      setSimMismatch(
        `  :        «${regMask}»    «${maskPhone(entered)}» 
 .       .`,
      );
      return;
    }
    // )          
    const deviceSim = getDeviceSim();
    if (deviceSim && entered !== deviceSim) {
      setSimMismatch(
        `     «${maskPhone(deviceSim)}»    .      .`,
      );
      return;
    }
    setSimMismatch("");
  }, [phone, mode, needPhone, regMask]);
  //              
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
            ? "  /  —   « »   ."
            : "     —   «  »   .",
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
    setOtpMsg(d?.message ?? d?.error ?? "   ");
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
      setOtpMsg("     ");
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
      setOtpMsg(d.error ?? "  ");
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
      setError(simWarn || "       .");
      return;
    }
    if (mode === "rep" && needPhone && simMismatch) {
      setError(simMismatch);
      return;
    }
    if (needPhone && !/^0\d{10}$/.test(phone.replace(/\D/g, ""))) {
      setError("            (: )");
      return;
    }
    //  :          
    if (!navigator.onLine) {
      const cached = getCachedUser();
      if (cached && cached.username === username.trim().toLowerCase()) {
        router.replace(cached.role === "rep" ? "/panel" : "/admin");
        return;
      }
      setError("   .          .");
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
      setError(data.error ?? "  ");
      if (data.simError) setSimMismatch(data.error ?? "");

      return;
    }
    if (data.token) setTabToken(data.token, true);
    if (data.user) cacheUser(data.user);
    if (phone) {
      localStorage.setItem("sek_phone", phone);
      //         
      if (data.user?.role === "rep") setDeviceSim(normalizePhone(phone));
    }
    router.replace(data.user?.role === "rep" ? "/panel" : "/admin");
  };
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-teal-700 via-teal-600 to-slate-
100 p-4">
      <div className="w-full max-w-md">
        {otpStep ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
            <div className="fade-in w-full max-w-sm rounded-2xl bg-white p-4">
              <h3 className="mb-1 text-sm font-black text-slate-800">  </h3>
              <p className="mb-3 text-[11px] leading-6 text-slate-600">
                        <b>   </b>     
                .            .
              </p>
              {otpMsg ? (
                <div className="mb-2">
                  <Alert kind={otpMsg.includes(" ") ? "success" : "info"}>{otpMsg}</Alert>
                </div>
              ) : null}
              <Field label=" " required>
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
                  {otpBusy ? "..." : "   "}
                </Button>
                <Button variant="soft" onClick={requestOtp} disabled={otpBusy || otpLeft > 0}>
                  {otpLeft > 0 ? `  (${toPersianDigits(otpLeft)})` : "   "}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setOtpStep(false);
                    setOtpCode("");
                    setOtpMsg("");
                  }}
                >
                  
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
              <h3 className="mb-2 text-sm font-black text-slate-800">   </h3>
              <p className="mb-3 text-[11px] text-slate-500">
                        .           
                  .
              </p>
              {info ? (
                <div className="mb-2">
                  <Alert kind="success">{info}</Alert>
                </div>
              ) : null}
              <div className="space-y-2">
                <Field label=" " required>
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} className="text-left" />
                </Field>
                <Field label=" ">

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
                    setInfo(d.message ?? d.error ?? " ");
                  }}
                >
                   
                </Button>
                <Button variant="ghost" onClick={() => setForgot(false)}>
                  
                </Button>
              </div>
            </div>
          </div>
        ) : null}
        <div className="mb-5 text-center text-white">
          <div className="relative mx-auto mb-3 size-24">
            <div className="absolute inset-1 rounded-[1.75rem] bg-white/20 blur-lg" />
            <div className="relative flex size-24 items-center justify-center overflow-hidden rounded-[1.75rem] bg-white
 shadow-2xl ring-1 ring-white/70">
              {/*     */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/icon-192.png"
                alt="    "
                width={84}
                height={84}
                className="size-[84px] object-contain"
              />
            </div>
            <span className="absolute -bottom-1 -left-1 flex size-7 items-center justify-center rounded-full bg-emerald-
400 text-xs shadow-lg ring-2 ring-teal-700">
              
            </span>
          </div>
          <h1 className="text-2xl font-black drop-shadow-sm">  </h1>
          <p className="mt-1 text-xs font-medium text-teal-50/90">   </p>
          <div className="mx-auto mt-2 flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] text
-teal-50 ring-1 ring-white/20">
            <span></span><span className="opacity-50">•</span><span></span><span className="opacity-50">•</span
><span></span><span className="opacity-50">•</span><span></span>
          </div>
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
                 / 
            </button>
          </div>

          {mode === "rep" && simWarn ? <Alert kind="error">{simWarn}</Alert> : null}
          {mode === "rep" && simMismatch ? <Alert kind="error">{simMismatch}</Alert> : null}
          {hint ? <Alert kind="info">{hint}</Alert> : null}
          {error ? <Alert kind="error">{error}</Alert> : null}
          <Field label=" " required>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={mode === "admin" ? "  " : "  "}
              autoComplete="off"
            />
          </Field>
          <Field label=" " required>
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
                title={showPass ? "  " : " "}
              >
                {showPass ? "" : ""}
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
                <span>{simMismatch ? "" : simOk ? "" : ""}    </span>
                {netType ? <span className="rounded bg-white/70 px-2 py-0.5">: {netType}</span> : null}
                {regMask ? <span className="rounded bg-white/70 px-2 py-0.5"> : {regMask}</span> : null}
                {deviceBound ? <span className="rounded bg-white/70 px-2 py-0.5">    </span> : null}
              </div>
              {!simMismatch && simOk ? (
                <div className="mt-1 font-normal">
                            .
                </div>
              ) : null}
            </div>
          ) : null}
          {needPhone ? (
            <Field label="     " required hint="        
">
              <Input
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 11))}
                placeholder="09xxxxxxxxx"
              />
            </Field>
          ) : (
            <Alert kind="info">         .</Alert>
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
                   
            </button>

          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <input
              type="checkbox"
              className="size-4 accent-teal-600"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
                (           )
          </label>
          <Button type="submit" disabled={busy || (mode === "rep" && needPhone && !!simMismatch)} className="w-full">
            {busy ? "  ..." : mode === "admin" ? "    " : "    "}
          </Button>
          <div className="pt-1 text-center">
            <a href="/diagnostics" className="text-[11px] font-bold text-teal-700 underline">
                     
            </a>
          </div>
          <p className="pt-1 text-center text-[11px] leading-5 text-slate-400">
            : admin / admin1234 — : sarparast / sar1234 — : rep1 / rep1234
          </p>
        </form>
      </div>
    </main>
  );
}
