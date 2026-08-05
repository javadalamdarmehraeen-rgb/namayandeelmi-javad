"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Badge, Button, Card, Field, Input, SectionTitle } from "@/components/ui";
import { tehranDateTime, toPersianDigits } from "@/lib/jalali";
import { useConfirm } from "@/components/Confirm";

type Cfg = { enabled: boolean; minutes: number; withFiles: boolean; folderName: string };

const DEFAULT_CFG: Cfg = { enabled: false, minutes: 30, withFiles: false, folderName: "namayandeelmi-javad" };
const IDB = "sek-backup";

// ذخیره دسترسی پوشه انتخاب‌شده برای دفعات بعد
function idb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(IDB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("h");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function saveHandle(h: unknown) {
  const db = await idb();
  const tx = db.transaction("h", "readwrite");
  tx.objectStore("h").put(h, "dir");
}
async function loadHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await idb();
    return await new Promise((res) => {
      const tx = db.transaction("h", "readonly");
      const rq = tx.objectStore("h").get("dir");
      rq.onsuccess = () => res((rq.result as FileSystemDirectoryHandle) ?? null);
      rq.onerror = () => res(null);
    });
  } catch {
    return null;
  }
}

export default function BackupPage() {
  const [cfg, setCfg] = useState<Cfg>(DEFAULT_CFG);
  const [msg, setMsg] = useState("");
  const [last, setLast] = useState("");
  const [dirOk, setDirOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [dirName, setDirName] = useState("");
  const confirm = useConfirm();
  const supportsFs = typeof window !== "undefined" && "showDirectoryPicker" in window;

  const load = useCallback(async () => {
    const res = await fetch("/api/settings?key=backup", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      if (d.value) setCfg({ ...DEFAULT_CFG, ...(d.value as Cfg) });
    }
    setLast(localStorage.getItem("sek_backup_last") ?? "");
    const h = await loadHandle();
    setDirOk(Boolean(h));
    setDirName(h?.name ?? localStorage.getItem("sek_backup_dir") ?? "");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveCfg = async (next: Cfg) => {
    setCfg(next);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "backup", value: next }),
    });
    setMsg("✅ تنظیمات پشتیبان‌گیری ذخیره شد");
  };

  const pickFolder = async () => {
    try {
      const w = window as unknown as {
        showDirectoryPicker: (o?: { mode?: string }) => Promise<FileSystemDirectoryHandle>;
      };
      const handle = await w.showDirectoryPicker({ mode: "readwrite" });
      await saveHandle(handle);
      setDirOk(true);
      setDirName(handle.name ?? "");
      localStorage.setItem("sek_backup_dir", handle.name ?? "");
      setMsg(`✅ پوشه «${handle.name}» انتخاب شد. همه پشتیبان‌ها مستقیم در همین پوشه ذخیره می‌شوند (بدون رفتن به Downloads).`);
    } catch {
      setMsg("انتخاب پوشه لغو شد");
    }
  };

  const runBackup = useCallback(
    async (auto = false, forceDownload = false) => {
      setBusy(true);
      try {
        const res = await fetch(`/api/backup${cfg.withFiles ? "?files=1" : ""}`, { cache: "no-store" });
        if (!res.ok) throw new Error("خطا در دریافت پشتیبان");
        const blob = await res.blob();
        const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
        const name = `namayandeelmi-backup-${stamp}.json`;

        const handle = forceDownload ? null : await loadHandle();
        if (handle) {
          const perm = await (
            handle as unknown as { queryPermission: (o: { mode: string }) => Promise<string> }
          ).queryPermission({ mode: "readwrite" });
          if (perm !== "granted") {
            await (
              handle as unknown as { requestPermission: (o: { mode: string }) => Promise<string> }
            ).requestPermission({ mode: "readwrite" });
          }
          const fh = await handle.getFileHandle(name, { create: true });
          const ws = await fh.createWritable();
          await ws.write(blob);
          await ws.close();
          setLog((l) => [`✅ ${tehranDateTime(new Date())} — ذخیره در پوشه: ${name}`, ...l].slice(0, 20));
        } else if (forceDownload) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = name;
          a.click();
          URL.revokeObjectURL(url);
          setLog((l) => [`⬇️ ${tehranDateTime(new Date())} — دانلود شد: ${name}`, ...l].slice(0, 20));
        } else if (supportsFs) {
          // پوشه انتخاب نشده: از کاربر می‌خواهیم مسیر ذخیره را انتخاب کند (بدون رفتن به Downloads)
          try {
            const w = window as unknown as {
              showSaveFilePicker: (o: unknown) => Promise<FileSystemFileHandle>;
            };
            const fh = await w.showSaveFilePicker({
              suggestedName: name,
              types: [{ description: "فایل پشتیبان JSON", accept: { "application/json": [".json"] } }],
            });
            const ws = await fh.createWritable();
            await ws.write(blob);
            await ws.close();
            setLog((l) => [`✅ ${tehranDateTime(new Date())} — ذخیره در مسیر انتخابی: ${name}`, ...l].slice(0, 20));
          } catch {
            setBusy(false);
            setMsg("ذخیره لغو شد");
            return;
          }
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = name;
          a.click();
          URL.revokeObjectURL(url);
          setLog((l) => [`⬇️ ${tehranDateTime(new Date())} — دانلود شد: ${name}`, ...l].slice(0, 20));
        }
        const now = new Date().toISOString();
        localStorage.setItem("sek_backup_last", now);
        setLast(now);
        if (!auto) setMsg("✅ پشتیبان‌گیری با موفقیت انجام شد");
      } catch (e) {
        setMsg(`✖ ${e instanceof Error ? e.message : "خطا در پشتیبان‌گیری"}`);
      } finally {
        setBusy(false);
      }
    },
    [cfg.withFiles, supportsFs],
  );

  // زمان‌بند خودکار
  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (!cfg.enabled) return;
    const ms = Math.max(1, cfg.minutes) * 60000;
    timer.current = setInterval(() => {
      const lastAt = Number(new Date(localStorage.getItem("sek_backup_last") ?? 0));
      if (Date.now() - lastAt >= ms) runBackup(true);
    }, 30000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [cfg.enabled, cfg.minutes, runBackup]);

  const winScript = `@echo off
rem ============================================================
rem  پشتیبان‌گیری خودکار «ثبت اطلاعات کل» روی ویندوز
rem  فایل را با نام backup.bat در E:\\porozheha\\backup ذخیره کنید
rem  سپس در Task Scheduler ویندوز هر چند دقیقه یک‌بار اجرا کنید
rem ============================================================
set URL=${typeof window !== "undefined" ? window.location.origin : "https://your-app.onrender.com"}/api/backup
set DEST=E:\\porozheha\\backup\\${cfg.folderName}
set COOKIE=%~dp0cookie.txt
if not exist "%DEST%" mkdir "%DEST%"
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do set D=%%d-%%b-%%c
set T=%time:~0,2%%time:~3,2%
curl -s -c "%COOKIE%" -X POST "%URL:/api/backup=/api/auth/login%" -H "Content-Type: application/json" -d "{\\"username\\":\\"admin\\",\\"password\\":\\"PASSWORD\\",\\"mode\\":\\"admin\\",\\"remember\\":true}" > nul
curl -s -b "%COOKIE%" "%URL%" -o "%DEST%\\backup-%D%-%T%.json"
echo backup saved to %DEST%
`;

  return (
    <div className="space-y-4">
      <SectionTitle icon="💾">پشتیبان‌گیری از اطلاعات</SectionTitle>
      {msg ? <Alert kind={msg.startsWith("✖") ? "error" : "success"}>{msg}</Alert> : null}

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={async () => {
              if (
                !(await confirm({
                  title: "پشتیبان‌گیری",
                  message: dirOk
                    ? `فایل پشتیبان در پوشه «${dirName}» ذخیره شود؟`
                    : "پنجره انتخاب مسیر باز شود تا محل ذخیره فایل را انتخاب کنید؟",
                  confirmText: "شروع",
                }))
              )
                return;
              runBackup(false);
            }}
            disabled={busy}
          >
            {busy ? "⏳ در حال تهیه..." : "💾 پشتیبان‌گیری در پوشه"}
          </Button>
          <Button variant="ghost" onClick={() => runBackup(false, true)} disabled={busy}>
            ⬇️ دانلود ساده
          </Button>
          {supportsFs ? (
            <Button variant={dirOk ? "success" : "soft"} onClick={pickFolder}>
              {dirOk ? `✅ پوشه: ${dirName || "انتخاب‌شده"} — تغییر` : "📁 انتخاب پوشه مقصد"}
            </Button>
          ) : null}
          <Badge tone={last ? "green" : "amber"}>
            آخرین پشتیبان: {last ? tehranDateTime(last) : "هرگز"}
          </Badge>
        </div>

        {!dirOk ? (
          <Alert kind="error">
            ⚠️ هنوز پوشه مقصد انتخاب نشده است. تا زمانی که پوشه را انتخاب نکنید، هنگام پشتیبان‌گیری پنجره انتخاب مسیر
            باز می‌شود. برای ذخیره خودکار، یک‌بار دکمه «📁 انتخاب پوشه مقصد» را بزنید.
          </Alert>
        ) : null}
        <Alert kind="info">
          <b>راهنمای مسیر E:\porozheha\backup\{cfg.folderName}</b> — چون برنامه در مرورگر اجرا می‌شود، برای نوشتن
          مستقیم روی درایو ویندوز یک بار باید پوشه را انتخاب کنید: دکمه «📁 انتخاب پوشه مقصد» را بزنید و مسیر
          <span dir="ltr"> E:\porozheha\backup\{cfg.folderName} </span> را انتخاب کنید. از آن پس همه پشتیبان‌ها
          (دستی و خودکار) مستقیماً داخل همان پوشه ذخیره می‌شوند. اگر مرورگر شما این قابلیت را نداشت، فایل در پوشه
          دانلود ذخیره می‌شود.
        </Alert>
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">⏱ پشتیبان‌گیری خودکار</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="هر چند دقیقه یک‌بار؟">
            <Input
              inputMode="numeric"
              value={String(cfg.minutes)}
              onChange={(e) => setCfg({ ...cfg, minutes: Number(e.target.value.replace(/\D/g, "")) || 1 })}
            />
          </Field>
          <Field label="نام پوشه مقصد">
            <Input value={cfg.folderName} onChange={(e) => setCfg({ ...cfg, folderName: e.target.value })} />
          </Field>
          <div className="flex flex-col justify-end gap-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <input
                type="checkbox"
                className="size-4 accent-teal-600"
                checked={cfg.withFiles}
                onChange={(e) => setCfg({ ...cfg, withFiles: e.target.checked })}
              />
              شامل فایل‌ها و تصاویر (حجیم‌تر)
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <input
                type="checkbox"
                className="size-4 accent-teal-600"
                checked={cfg.enabled}
                onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })}
              />
              پشتیبان‌گیری خودکار فعال باشد
            </label>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            onClick={async () => {
              if (
                !(await confirm({
                  title: "ذخیره تنظیمات پشتیبان‌گیری",
                  message: cfg.enabled
                    ? `پشتیبان‌گیری خودکار هر ${cfg.minutes} دقیقه فعال شود؟`
                    : "پشتیبان‌گیری خودکار غیرفعال شود؟",
                  confirmText: "ذخیره",
                }))
              )
                return;
              saveCfg(cfg);
            }}
          >
            💾 ذخیره تنظیمات
          </Button>
          <Badge tone={cfg.enabled ? "green" : "slate"}>
            {cfg.enabled ? `فعال — هر ${toPersianDigits(cfg.minutes)} دقیقه` : "غیرفعال"}
          </Badge>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          توجه: پشتیبان‌گیری خودکار زمانی اجرا می‌شود که این صفحه در مرورگر باز باشد. برای اجرای کاملاً مستقل، از
          اسکریپت ویندوزی زیر استفاده کنید.
        </p>
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">🖥 اسکریپت خودکار ویندوز (بدون نیاز به باز بودن مرورگر)</h3>
        <p className="mb-2 text-[11px] text-slate-500">
          کد زیر را کپی و با نام <span dir="ltr">backup.bat</span> ذخیره کنید، رمز مدیر را داخل آن بگذارید و در
          Task Scheduler ویندوز زمان‌بندی کنید (مثلاً هر ۳۰ دقیقه).
        </p>
        <pre className="scroll-x max-h-56 overflow-auto rounded-xl bg-slate-900 p-3 text-[11px] leading-5 text-emerald-200" dir="ltr">
          {winScript}
        </pre>
        <div className="mt-2 flex gap-2">
          <Button
            variant="soft"
            onClick={() => {
              navigator.clipboard?.writeText(winScript);
              setMsg("✅ اسکریپت کپی شد");
            }}
          >
            📋 کپی اسکریپت
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              const blob = new Blob([winScript], { type: "text/plain" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = "backup.bat";
              a.click();
            }}
          >
            ⬇️ دانلود backup.bat
          </Button>
        </div>
      </Card>

      {log.length ? (
        <Card>
          <h3 className="mb-2 text-sm font-bold text-slate-700">📜 گزارش پشتیبان‌گیری این جلسه</h3>
          <ul className="space-y-1 text-[11px] text-slate-600">
            {log.map((l, i) => (
              <li key={i} className="rounded-lg bg-slate-50 px-2 py-1">
                {l}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
