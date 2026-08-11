"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Badge, Button, Card, Field, Input, SectionTitle } from "@/components/ui";
import { tehranDateTime, toPersianDigits } from "@/lib/jalali";
import { useConfirm } from "@/components/Confirm";
type Cfg = { enabled: boolean; minutes: number; withFiles: boolean; folderName: string };
const DEFAULT_CFG: Cfg = { enabled: false, minutes: 30, withFiles: false, folderName: "namayandeelmi-javad" };
const IDB = "sek-backup";

//       
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
    setMsg("    ");
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
      setMsg(`  «${handle.name}»  .         (   Downloads
).`);
    } catch {
      setMsg("   ");
    }
  };
  const runBackup = useCallback(

    async (auto = false, forceDownload = false) => {
      setBusy(true);
      try {
        const res = await fetch(`/api/backup${cfg.withFiles ? "?files=1" : ""}`, { cache: "no-store" });
        if (!res.ok) throw new Error("   ");
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
          setLog((l) => [` ${tehranDateTime(new Date())} —   : ${name}`, ...l].slice(0, 20));
        } else if (forceDownload) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = name;
          a.click();
          URL.revokeObjectURL(url);
          setLog((l) => [` ${tehranDateTime(new Date())} —  : ${name}`, ...l].slice(0, 20));
        } else if (supportsFs) {
          //   :         (   Downloads)
          try {
            const w = window as unknown as {
              showSaveFilePicker: (o: unknown) => Promise<FileSystemFileHandle>;
            };
            const fh = await w.showSaveFilePicker({
              suggestedName: name,
              types: [{ description: "  JSON", accept: { "application/json": [".json"] } }],
            });
            const ws = await fh.createWritable();
            await ws.write(blob);
            await ws.close();
            setLog((l) => [` ${tehranDateTime(new Date())} —    : ${name}`, ...l].slice(0, 20));
          } catch {
            setBusy(false);
            setMsg("  ");
            return;
          }
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = name;
          a.click();
          URL.revokeObjectURL(url);
          setLog((l) => [` ${tehranDateTime(new Date())} —  : ${name}`, ...l].slice(0, 20));
        }
        const now = new Date().toISOString();
        localStorage.setItem("sek_backup_last", now);
        setLast(now);
        if (!auto) setMsg("     ");
      } catch (e) {
        setMsg(` ${e instanceof Error ? e.message : "  "}`);
      } finally {
        setBusy(false);
      }
    },
    [cfg.withFiles, supportsFs],
  );
  //  
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
rem    «  »  
rem      backup.bat  E:\\porozheha\\backup  
rem    Task Scheduler       
rem ============================================================
set URL=${typeof window !== "undefined" ? window.location.origin : "https://your-app.onrender.com"}/api/backup
set DEST=E:\\porozheha\\backup\\${cfg.folderName}
set COOKIE=%~dp0cookie.txt
if not exist "%DEST%" mkdir "%DEST%"
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do set D=%%d-%%b-%%c
set T=%time:~0,2%%time:~3,2%
curl -s -c "%COOKIE%" -X POST "%URL:/api/backup=/api/auth/login%" -H "Content-Type: application/json" -d "{\\"username\\
":\\"admin\\",\\"password\\":\\"PASSWORD\\",\\"mode\\":\\"admin\\",\\"remember\\":true}" > nul
curl -s -b "%COOKIE%" "%URL%" -o "%DEST%\\backup-%D%-%T%.json"
echo backup saved to %DEST%
`;
  return (
    <div className="space-y-4">
      <SectionTitle icon="">  </SectionTitle>
      {msg ? <Alert kind={msg.startsWith("") ? "error" : "success"}>{msg}</Alert> : null}
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={async () => {
              if (
                !(await confirm({
                  title: "",
                  message: dirOk
                    ? `    «${dirName}»  `
                    : "           ",
                  confirmText: "",
                }))
              )
                return;
              runBackup(false);
            }}
            disabled={busy}
          >
            {busy ? "   ..." : "   "}
          </Button>
          <Button variant="ghost" onClick={() => runBackup(false, true)} disabled={busy}>
              
          </Button>
          {supportsFs ? (
            <Button variant={dirOk ? "success" : "soft"} onClick={pickFolder}>
              {dirOk ? ` : ${dirName || ""} — ` : "   "}
            </Button>
          ) : null}
          <Badge tone={last ? "green" : "amber"}>
             : {last ? tehranDateTime(last) : ""}
          </Badge>
        </div>
        {!dirOk ? (
          <Alert kind="error">
                  .            
             .      «   »  .
          </Alert>
        ) : null}
        <Alert kind="info">
          <b>  E:\porozheha\backup\{cfg.folderName}</b> —        
                    :  «   »    
          <span dir="ltr"> E:\porozheha\backup\{cfg.folderName} </span>   .     
          (  )      .          
            .
        </Alert>
      </Card>
      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">  </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="   ">
            <Input
              inputMode="numeric"
              value={String(cfg.minutes)}
              onChange={(e) => setCfg({ ...cfg, minutes: Number(e.target.value.replace(/\D/g, "")) || 1 })}
            />
          </Field>
          <Field label="  ">
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
                  ()
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <input
                type="checkbox"
                className="size-4 accent-teal-600"
                checked={cfg.enabled}
                onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })}
              />
                 
            </label>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            onClick={async () => {
              if (
                !(await confirm({
                  title: "  ",
                  message: cfg.enabled
                    ? `   ${cfg.minutes}   `
                    : "   ",
                  confirmText: "",
                }))
              )
                return;
              saveCfg(cfg);
            }}
          >
              
          </Button>
          <Badge tone={cfg.enabled ? "green" : "slate"}>
            {cfg.enabled ? ` —  ${toPersianDigits(cfg.minutes)} ` : ""}
          </Badge>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          :            .     
              .
        </p>
      </Card>
      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">    (     )</h3
>
        <p className="mb-2 text-[11px] text-slate-500">
                 <span dir="ltr">backup.bat</span>          
          Task Scheduler    (   ).
        </p>
        <pre className="scroll-x max-h-56 overflow-auto rounded-xl bg-slate-900 p-3 text-[11px] leading-5 text-emerald-2
00" dir="ltr">
          {winScript}
        </pre>
        <div className="mt-2 flex gap-2">
          <Button
            variant="soft"
            onClick={() => {
              navigator.clipboard?.writeText(winScript);
              setMsg("   ");
            }}
          >
              
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
              backup.bat
          </Button>
        </div>
      </Card>

      {log.length ? (
        <Card>
          <h3 className="mb-2 text-sm font-bold text-slate-700">    </h3>
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
