"use client";
import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Field, Input, SectionTitle } from "@/components/ui";
import { useConfirm } from "@/components/Confirm";
import { useLive } from "@/lib/useLive";
import { orderedEndpoints, pickFastestEndpoint } from "@/lib/endpoints";
import { downloadFile } from "@/lib/download";
import { tehranDateTime, toPersianDigits } from "@/lib/jalali";
type Peer = {
  id: number;
  peer: string;
  peerUrl: string;
  enabled: boolean;
  pullCursor: string | null;
  pushCursor: string | null;
  lastSyncAt: string | null;
  lastStatus: string;
  lastError: string;
  pulled: number;
  pushed: number;
  conflicts: number;
};
type Log = {
  id: number;
  peer: string;
  direction: string;
  tableName: string;
  applied: number;
  skipped: number;
  ok: boolean;
  detail: string;
  createdAt: string;
};
type Info = { node: string; url: string; peers: { peer: string; url: string }[]; hasSecret: boolean; tables: string[] };
export default function SyncPage() {
  const [info, setInfo] = useState<Info | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ peer: "", peerUrl: "" });
  const [speeds, setSpeeds] = useState<{ url: string; ms: number | null }[]>([]);
  const [srcInfo, setSrcInfo] = useState<{ count: number } | null>(null);
  const [dlBusy, setDlBusy] = useState(false);
  const confirm = useConfirm();
  const load = useCallback(async () => {

    const res = await fetch("/api/sync/status", { cache: "no-store" });
    if (!res.ok) return;
    const d = await res.json();
    setInfo(d.info);
    setPeers(d.peers ?? []);
    setLogs(d.logs ?? []);
  }, []);
  useLive(load, 20000);
  const runSync = async () => {
    if (!(await confirm({ title: "", message: "      ", confirmText: "" })))
      return;
    setBusy(true);
    setMsg("   ...");
    const res = await fetch("/api/sync/run", { method: "POST" });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(d.summary ?? (res.ok ? " " : " "));
    load();
  };
  const patch = async (body: Record<string, unknown>) => {
    await fetch("/api/sync/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    load();
  };
  const addPeer = async () => {
    if (!form.peer || !form.peerUrl.startsWith("http")) return setMsg("      ");
    const res = await fetch("/api/sync/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setMsg(res.ok ? "    " : " ");
    setForm({ peer: "", peerUrl: "" });
    load();
  };
  const testSpeed = async () => {
    setMsg("   ...");
    const r = await pickFastestEndpoint(true);
    setSpeeds(r);
    const best = r.filter((x) => x.ms !== null).sort((a, b) => (a.ms ?? 9e9) - (b.ms ?? 9e9))[0];
    setMsg(best ? `  : ${best.url} (${best.ms} )` : "    ");
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle icon="">  </SectionTitle>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={testSpeed}>
               
          </Button>
          <Button onClick={runSync} disabled={busy}>
            {busy ? " ..." : "  "}
          </Button>
        </div>
      </div>
      {msg ? <Alert kind={msg.startsWith("") ? "error" : "success"}>{msg}</Alert> : null}
      {/* ----------      GitHub / GitLab ---------- */}
      <Card>
        <h3 className="mb-2 text-sm font-black text-slate-800">    </h3>
        <Alert kind="info">
                .    <b>GitHub</b>  <b>GitLab</b>     ZIP
                          
          <span dir="ltr"> git add -A && git commit && git push </span> .       .
        </Alert>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            onClick={async () => {
              setDlBusy(true);
              setMsg("     ...");
              const r = await downloadFile("/api/source", "namayandeelmi-source.zip");
              setDlBusy(false);
              setMsg(r);
            }}
            disabled={dlBusy}
          >

            {dlBusy ? "   ..." : "    (ZIP)"}
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              const r = await fetch("/api/source?list=1", { cache: "no-store" });
              if (!r.ok) return setMsg("    ");
              const d = await r.json();
              setSrcInfo({ count: d.count });
              setMsg(` ${d.count}     `);
            }}
          >
               
          </Button>
          {srcInfo ? <Badge tone="green">{toPersianDigits(srcInfo.count)} </Badge> : null}
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          :  <span dir="ltr">node_modules</span>  <span dir="ltr">.next</span>  
          <span dir="ltr"> .env </span>    (    ).
        </p>
      </Card>
      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">  </h3>
        <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
             : <b className="text-teal-700">{info?.node ?? "—"}</b>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
            : <b dir="ltr">{info?.url || window.location.origin}</b>
          </div>
          <div className={`rounded-xl p-3 ring-1 ${info?.hasSecret ? "bg-emerald-50 ring-emerald-200" : "bg-rose-50 ring
-rose-200"}`}>
             : <b>{info?.hasSecret ? "  " : "   (SYNC_SECRET)"}</b>
          </div>
        </div>
        {info?.tables?.length ? (
          <p className="mt-2 text-[11px] text-slate-500">
             : {info.tables.join(" ")}
          </p>
        ) : null}
        {speeds.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {speeds.map((s) => (
              <span
                key={s.url}
                className={`rounded-lg px-2 py-1 text-[11px] font-bold ring-1 ${
                  s.ms === null ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-emerald-50 text-emerald-700 ring-emeral
d-200"
                }`}
                dir="ltr"
              >
                {s.url} — {s.ms === null ? "  " : `${toPersianDigits(s.ms)}ms`}
              </span>
            ))}
          </div>
        ) : null}
        <p className="mt-2 text-[10px] text-slate-400" dir="ltr">
          endpoints: {orderedEndpoints().join(" , ")}
        </p>
      </Card>
      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">  </h3>
        {peers.length === 0 ? (
          <Alert kind="info">
                 .    <b dir="ltr">SYNC_PEERS</b>     .
          </Alert>
        ) : null}
        <div className="space-y-2">
          {peers.map((p) => (
            <div key={p.id} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-black text-slate-800">{p.peer}</span>
                <Badge tone={p.enabled ? "green" : "amber"}>{p.enabled ? "" : ""}</Badge>
                <span className="text-[11px] text-slate-500" dir="ltr">
                  {p.peerUrl}
                </span>
                <div className="mr-auto flex flex-wrap gap-1">
                  <button
                    onClick={() => patch({ id: p.id, enabled: !p.enabled })}
                    className="rounded-lg bg-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700"
                  >
                    {p.enabled ? "" : ""}

                  </button>
                  <button
                    onClick={async () => {
                      if (
                        !(await confirm({
                          title: " ",
                          message: "           ",
                          confirmText: "",
                          danger: true,
                        }))
                      )
                        return;
                      patch({ id: p.id, resetCursor: true });
                    }}
                    className="rounded-lg bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-700"
                  >
                     
                  </button>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="rounded-lg bg-white py-1 ring-1 ring-slate-200">
                   <b className="text-teal-700">{toPersianDigits(p.pulled)}</b>
                </div>
                <div className="rounded-lg bg-white py-1 ring-1 ring-slate-200">
                   <b className="text-sky-700">{toPersianDigits(p.pushed)}</b>
                </div>
                <div className="rounded-lg bg-white py-1 ring-1 ring-slate-200">
                   <b className="text-slate-500">{toPersianDigits(p.conflicts)}</b>
                </div>
              </div>
              <div className="mt-2 text-[11px]">
                <span className={p.lastStatus.startsWith("") ? "text-emerald-700" : "text-slate-600"}>
                  {p.lastStatus || "  "}
                </span>
                {p.lastSyncAt ? <span className="mr-2 text-slate-400">{tehranDateTime(p.lastSyncAt)}</span> : null}
              </div>
              {p.lastError ? <div className="mt-1 rounded-lg bg-rose-50 px-2 py-1 text-[10px] text-rose-700">{p.lastErro
r}</div> : null}
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Field label="  ">
            <Input value={form.peer} onChange={(e) => setForm({ ...form, peer: e.target.value })} placeholder="ndcohub" 
/>
          </Field>
          <Field label="  ">
            <Input
              value={form.peerUrl}
              onChange={(e) => setForm({ ...form, peerUrl: e.target.value })}
              placeholder="https://ndcohub.ir"
              className="text-left"
            />
          </Field>
          <div className="flex items-end">
            <Button onClick={addPeer} className="w-full">
                
            </Button>
          </div>
        </div>
      </Card>
      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">  </h3>
        <div className="max-h-72 space-y-1 overflow-y-auto text-[11px]">
          {logs.map((l) => (
            <div key={l.id} className={`rounded-lg px-2 py-1.5 ${l.ok ? "bg-slate-50" : "bg-rose-50"}`}>
              <span className={l.ok ? "text-emerald-700" : "text-rose-700"}>{l.ok ? "" : ""}</span>{" "}
              <b>{l.peer}</b> — {l.direction === "pull" ? "" : l.direction === "push" ? "" : ""}
              {l.tableName ? ` | ${l.tableName}` : ""}
              {l.applied || l.skipped ? ` |  ${toPersianDigits(l.applied)} /  ${toPersianDigits(l.skipped)}` : ""
}
              {l.detail ? <div className="text-slate-500">{l.detail}</div> : null}
              <span className="text-[10px] text-slate-400">{tehranDateTime(l.createdAt)}</span>
            </div>
          ))}
          {logs.length === 0 ? <p className="text-slate-400">    </p> : null}
        </div>
      </Card>
      <Card>

        <h3 className="mb-2 text-sm font-bold text-slate-700">  </h3>
        <ol className="list-inside list-decimal space-y-1 text-[11px] leading-6 text-slate-600">
          <li>
             <b>  </b>  <code dir="ltr">SYNC_SECRET</code>       .
          </li>
          <li>
             Render: <code dir="ltr">NODE_NAME=render</code> {" "}
            <code dir="ltr">SYNC_PEERS=ndcohub|https://ndcohub.ir</code>
          </li>
          <li>
             NdcoHub: <code dir="ltr">NODE_NAME=ndcohub</code> {" "}
            <code dir="ltr">SYNC_PEERS=render|https://namayandeelmi-javad.onrender.com</code>
          </li>
          <li>
              : <code dir="ltr">NEXT_PUBLIC_ENDPOINTS=https://ndcohub.ir,https://namayandeelmi-javad.onrender.com
</code>
          </li>
          <li>
             :  cron-job.org {" "}
            <code dir="ltr">/api/sync/run?key=SYNC_SECRET</code>      .
          </li>
        </ol>
      </Card>
    </div>
  );
}
