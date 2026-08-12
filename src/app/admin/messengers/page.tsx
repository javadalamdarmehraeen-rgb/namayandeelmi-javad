"use client";
import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Field, Input, SectionTitle } from "@/components/ui";

import { PLATFORMS } from "@/lib/constants";
import { tehranDateTime, toPersianDigits } from "@/lib/jalali";
import { useConfirm } from "@/components/Confirm";
import { useLive } from "@/lib/useLive";
type M = {
  id: number;
  platform: string;
  label: string;
  targetType: string;
  target: string;
  token: string;
  provider: string;
  apiUrl: string;
  enabled: boolean;
  lastStatus: string;
  lastOkAt: string | null;
  lastErrorAt: string | null;
};
type Log = { id: number; platform: string; target: string; ok: boolean; detail: string; createdAt: string };
type Proxy = { url: string; enabled: boolean; secret?: string };
type Chat = { id: string; title: string; type: string };
type Sms = { provider: string; apiKey: string; sender: string; pattern: string; enabled: boolean };
const WA_PROVIDERS = [
  { key: "whatsiplus", label: " (whatsiplus.ir)", hint: " API   | : …" },
  { key: "ultramsg", label: "UltraMsg", hint: ": instanceId:token | : 989121111111" },
  { key: "cloudapi", label: "WhatsApp Cloud API ()", hint: ": phoneNumberId:accessToken" },
  { key: "custom", label: " ", hint: "  {phone}  {text}  {token}" },
];
const emptyForm = (platform: string) => ({
  platform,
  label: "",
  targetType: platform === "whatsapp" ? "phone" : "group",
  target: "",
  token: "",
  provider: platform === "whatsapp" ? "whatsiplus" : "",
  apiUrl: "",
  enabled: true,
});
export default function MessengersPage() {
  const [rows, setRows] = useState<M[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [proxy, setProxy] = useState<Proxy>({ url: "", enabled: true, secret: "" });
  const [sms, setSms] = useState<Sms>({ provider: "kavenegar", apiKey: "", sender: "", pattern: "", enabled: false });
  const [sysTokens, setSysTokens] = useState<Record<string, string>>({});
  const [tab, setTab] = useState("telegram");
  const [form, setForm] = useState(emptyForm("telegram"));
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatBusy, setChatBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [showToken, setShowToken] = useState<Record<number, boolean>>({});
  const [testing, setTesting] = useState<number | null>(null);
  const [workerVersion, setWorkerVersion] = useState<"new" | "old" | "down" | "">("");
  const [autoSend, setAutoSend] = useState(true);
  const confirm = useConfirm();
  const meta = PLATFORMS.find((p) => p.key === tab)!;
  const load = useCallback(async () => {
    const res = await fetch("/api/messengers", { cache: "no-store" });
    if (!res.ok) return;
    const d = await res.json();
    setRows(d.rows ?? []);
    setLogs(d.logs ?? []);
    if (d.proxy) setProxy(d.proxy);
    if (d.sms) setSms(d.sms);
    if (typeof d.autoSend === "boolean") setAutoSend(d.autoSend);
  }, []);
  useLive(load, 30000);
  useEffect(() => {
    fetch("/api/messengers/updates", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setSysTokens(d?.tokens ?? {}))
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    setForm(emptyForm(tab));
    setChats([]);
  }, [tab]);

  /* -----------------------------  ----------------------------- */
  const add = async () => {
    if (!form.target.trim()) return setMsg("    ");
    if (meta.needsToken && !form.token.trim() && !sysTokens[tab]) {
      return setMsg("      ");
    }
    if (
      !(await confirm({
        title: `  ${meta.label}`,
        message: ` «${form.label || form.target}»  `,
        confirmText: "",
      }))
    )
      return;
    const res = await fetch("/api/messengers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setForm(emptyForm(tab));
      setMsg("    ");
      load();
    } else setMsg(` ${d.error ?? "  "}`);
  };
  const patch = async (body: Record<string, unknown>) => {
    await fetch("/api/messengers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    load();
  };
  const remove = async (m: M) => {
    if (
      !(await confirm({
        title: " ",
        message: ` «${m.label || m.target}»  `,
        confirmText: "",
        danger: true,
      }))
    )
      return;
    await fetch(`/api/messengers?id=${m.id}`, { method: "DELETE" });
    load();
  };
  const test = async (id: number) => {
    setTesting(id);
    setMsg("     ...");
    const res = await fetch("/api/messengers/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const d = await res.json().catch(() => ({}));
    setTesting(null);
    setMsg(d.ok ? `   (${d.via === "proxy" ? "  " : ""})` : ` ${d.detail ?? ""}`);
    load();
  };
  const testAll = async () => {
    setMsg("       ...");
    const res = await fetch("/api/messengers/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    const d = await res.json().catch(() => ({}));
    setMsg(
      d.summary
        ? `${d.sent}/${d.total}  — ${d.summary}`.slice(0, 400)
        : ` ${d.error ?? " "}`,
    );
    load();
  };
  const discover = async () => {
    setChatBusy(true);
    setChats([]);

    setMsg("    ...");
    const res = await fetch("/api/messengers/updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: tab, token: form.token }),
    });
    const d = await res.json().catch(() => ({}));
    setChatBusy(false);
    setChats(d.chats ?? []);
    setMsg(d.ok ? ` ${(d.chats ?? []).length}    —   ` : ` ${d.detail ?? ""}`);
  };
  const saveProxy = async (next: Proxy) => {
    setProxy(next);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "messagingProxy", value: next }),
    });
    setMsg(res.ok ? "    " : "   ");
  };
  const testProxy = async () => {
    setMsg("  ...");
    const res = await fetch("/api/messengers/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pingProxy: true }),
    });
    const d = await res.json().catch(() => ({}));
    setWorkerVersion(d.version ?? "");
    setMsg(d.detail ?? (d.ok ? "   " : "  "));
  };
  const copyWorker = async () => {
    const code = await fetch("/cloudflare-worker.js").then((r) => r.text()).catch(() => "");
    if (!code) return setMsg("     ");
    await navigator.clipboard.writeText(code).catch(() => window.open("/cloudflare-worker.js", "_blank"));
    setMsg("     —  Cloudflare    Deploy ");
  };
  const tabRows = rows.filter((r) => r.platform === tab);
  const activeCount = rows.filter((r) => r.enabled).length;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle icon="">    </SectionTitle>
        <div className="flex gap-2">
          <Badge tone={activeCount ? "green" : "amber"}>{toPersianDigits(activeCount)}  </Badge>
          <Button variant="soft" onClick={testAll}>
              
          </Button>
        </div>
      </div>
      {msg ? <Alert kind={msg.startsWith("") ? "error" : "success"}>{msg}</Alert> : null}
      {/* ------------------   ------------------ */}
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-black text-slate-800">   </span>
          <button
            onClick={async () => {
              const next = !autoSend;
              if (
                !(await confirm({
                  title: next ? "  " : "  ",
                  message: next
                    ? "             "
                    : "        .",
                  confirmText: next ? " " : " ",
                }))
              )
                return;
              setAutoSend(next);
              const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: "autoSendOrders", value: { enabled: next } }),
              });
              setMsg(res.ok ? (next ? "    " : "    ") : " ");
            }}
            className={`rounded-xl px-4 py-2 text-xs font-bold ${
              autoSend ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
            }`}

          >
            {autoSend ? "  —     " : "  —   "}
          </button>
          <span className="text-[11px] text-slate-500">
                        .
          </span>
        </div>
      </Card>
      {/* ------------------   ------------------ */}
      <div className="flex flex-wrap gap-1 rounded-2xl bg-slate-200 p-1">
        {PLATFORMS.map((p) => {
          const count = rows.filter((r) => r.platform === p.key).length;
          const on = rows.some((r) => r.platform === p.key && r.enabled);
          return (
            <button
              key={p.key}
              onClick={() => setTab(p.key)}
              className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                tab === p.key ? "bg-white text-teal-700 shadow" : "text-slate-600 hover:bg-white/50"
              }`}
            >
              {p.icon} {p.label}
              {count ? (
                <span className={`mr-1 rounded-md px-1.5 text-[10px] ${on ? "bg-emerald-100 text-emerald-700" : "bg-slat
e-200 text-slate-500"}`}>
                  {toPersianDigits(count)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {/* ------------------    ------------------ */}
      <Card>
        <h3 className="mb-2 text-sm font-black text-slate-800">
          {meta.icon}    {meta.label}
        </h3>
        <ol className="list-inside list-decimal space-y-1 text-[11px] leading-6 text-slate-600">
          {meta.guide.map((g, i) => (
            <li key={i}>{g}</li>
          ))}
        </ol>
        {sysTokens[tab] ? (
          <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-800">
                      ({sysTokens[tab]}) —     .
          </p>
        ) : null}
      </Card>
      {/* ------------------    ------------------ */}
      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">    {meta.label}</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label=" ( )">
            <Input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="  "
            />
          </Field>
          {tab === "whatsapp" ? (
            <Field label=" " hint={WA_PROVIDERS.find((p) => p.key === form.provider)?.hint}>
              <select
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              >
                {WA_PROVIDERS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label=" ">
              <select
                value={form.targetType}
                onChange={(e) => setForm({ ...form, targetType: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              >
                <option value="group"></option>

                <option value="channel"></option>
                <option value="phone"> </option>
              </select>
            </Field>
          )}
          <Field label=" " required hint={meta.targetHint}>
            <Input value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className="text-le
ft" />
          </Field>
          <Field label=" /  API" hint={meta.tokenHint}>
            <Input value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} className="text-left
" />
          </Field>
          {tab === "whatsapp" && form.provider === "custom" ? (
            <div className="sm:col-span-2">
              <Field label="  " hint=": https://api.example.com/send?to={phone}&msg={text}&key={toke
n}">
                <Input value={form.apiUrl} onChange={(e) => setForm({ ...form, apiUrl: e.target.value })} className="tex
t-left" />
              </Field>
            </div>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {tab === "telegram" || tab === "bale" ? (
            <Button variant="soft" onClick={discover} disabled={chatBusy}>
              {chatBusy ? " ..." : "   chat_id"}
            </Button>
          ) : null}
          <div className="flex-1" />
          <Button onClick={add}>  </Button>
        </div>
        {chats.length ? (
          <div className="mt-3 rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200">
            <div className="mb-1 text-[11px] font-bold text-slate-600">  :</div>
            <div className="flex flex-wrap gap-1">
              {chats.map((c) => (
                <button
                  key={c.id}
                  onClick={() =>
                    setForm({ ...form, target: c.id, label: c.title, targetType: c.type === "" ? "phone" : "group" }
)
                  }
                  className="rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-teal-700 ring-1 ring-teal-200 hove
r:bg-teal-50"
                >
                  {c.type === "" ? "" : ""} {c.title}
                  <span className="mr-1 text-[10px] text-slate-400" dir="ltr">
                    {c.id}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </Card>
      {/* ------------------    ------------------ */}
      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">
           {meta.label} ({toPersianDigits(tabRows.length)})
        </h3>
        {tabRows.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">   {meta.label}   </p>
        ) : (
          <div className="space-y-2">
            {tabRows.map((m) => (
              <div key={m.id} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-black text-slate-800">{m.label || " "}</span>
                  <Badge tone={m.enabled ? "green" : "amber"}>{m.enabled ? "" : ""}</Badge>
                  <span className="rounded bg-white px-2 py-0.5 text-[10px] text-slate-500" dir="ltr">
                    {m.target}
                  </span>
                  {m.provider ? (
                    <span className="rounded bg-white px-2 py-0.5 text-[10px] text-slate-500">
                      {WA_PROVIDERS.find((p) => p.key === m.provider)?.label ?? m.provider}
                    </span>
                  ) : null}
                  <div className="mr-auto flex flex-wrap gap-1">

                    <button
                      onClick={() => test(m.id)}
                      disabled={testing === m.id}
                      className="rounded-lg bg-sky-100 px-2 py-1 text-[11px] font-bold text-sky-700 disabled:opacity-50"
                    >
                      {testing === m.id ? "..." : "  "}
                    </button>
                    <button
                      onClick={() => patch({ id: m.id, enabled: !m.enabled })}
                      className="rounded-lg bg-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700"
                    >
                      {m.enabled ? " " : " "}
                    </button>
                    <button
                      onClick={() => setShowToken((s) => ({ ...s, [m.id]: !s[m.id] }))}
                      className="rounded-lg bg-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700"
                    >
                      {showToken[m.id] ? " " : " "}
                    </button>
                    <button
                      onClick={() => remove(m)}
                      className="rounded-lg bg-rose-100 px-2 py-1 text-[11px] font-bold text-rose-700"
                    >
                      
                    </button>
                  </div>
                </div>
                {showToken[m.id] ? (
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-bold text-slate-500"></span>
                      <Input
                        value={m.token}
                        onChange={(e) => setRows((p) => p.map((x) => (x.id === m.id ? { ...x, token: e.target.value } : 
x)))}
                        onBlur={() => patch({ id: m.id, token: m.token })}
                        className="text-left font-mono text-xs"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-bold text-slate-500"> </span>
                      <Input
                        value={m.target}
                        onChange={(e) => setRows((p) => p.map((x) => (x.id === m.id ? { ...x, target: e.target.value } :
 x)))}
                        onBlur={() => patch({ id: m.id, target: m.target })}
                        className="text-left font-mono text-xs"
                      />
                    </label>
                  </div>
                ) : null}
                {m.lastStatus ? (
                  <div
                    className={`mt-2 rounded-lg px-2 py-1 text-[10px] ${
                      m.lastStatus.startsWith("") ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {m.lastStatus}
                    {m.lastOkAt ? <span className="mr-2 text-slate-400"> : {tehranDateTime(m.lastOkAt)}</span> 
: null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>
      {/* ------------------  ------------------ */}
      <Card>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-700">   (    )</h3>
          <Badge tone={proxy.enabled ? "green" : "amber"}>{proxy.enabled ? "" : ""}</Badge>
        </div>
        <Alert kind="info">
           Render  //  .        Cloudflare Worker 
           .        .
        </Alert>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Field label=" ">
              <Input value={proxy.url} onChange={(e) => setProxy({ ...proxy, url: e.target.value })} className="text-lef
t" />

            </Field>
          </div>
          <Field label=" ">
            <Input value={proxy.secret ?? ""} onChange={(e) => setProxy({ ...proxy, secret: e.target.value })} />
          </Field>
        </div>
        {workerVersion === "old" ? (
          <Alert kind="error">
                      .   «  »     .
          </Alert>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => saveProxy(proxy)}> </Button>
          <Button variant={proxy.enabled ? "danger" : "success"} onClick={() => saveProxy({ ...proxy, enabled: !proxy.en
abled })}>
            {proxy.enabled ? " " : " "}
          </Button>
          <Button variant="ghost" onClick={testProxy}>
              
          </Button>
          <Button variant="soft" onClick={copyWorker}>
               
          </Button>
        </div>
      </Card>
      {/* ------------------  ------------------ */}
      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">   ( )</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Field label="">
            <select
              value={sms.provider}
              onChange={(e) => setSms({ ...sms, provider: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            >
              <option value="kavenegar"></option>
              <option value="smsir">SMS.ir</option>
              <option value="melipayamak"></option>
              <option value="custom"> </option>
            </select>
          </Field>
          <Field label=" API">
            <Input value={sms.apiKey} onChange={(e) => setSms({ ...sms, apiKey: e.target.value })} className="text-left"
 />
          </Field>
          <Field label=" ">
            <Input value={sms.sender} onChange={(e) => setSms({ ...sms, sender: e.target.value })} className="text-left"
 />
          </Field>
          <Field label=" ">
            <Input value={sms.pattern} onChange={(e) => setSms({ ...sms, pattern: e.target.value })} className="text-lef
t" />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <input
              type="checkbox"
              className="size-4 accent-teal-600"
              checked={sms.enabled}
              onChange={(e) => setSms({ ...sms, enabled: e.target.checked })}
            />
             
          </label>
          <Button
            onClick={async () => {
              const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: "sms", value: sms }),
              });
              setMsg(res.ok ? "    " : " ");
            }}
          >
             
          </Button>
        </div>
      </Card>
      {/* ------------------  ------------------ */}
      <Card>
        <SectionTitle icon=""> </SectionTitle>
        <div className="max-h-72 space-y-1 overflow-y-auto text-xs">
          {logs.map((l) => (

            <div key={l.id} className={`rounded-lg px-3 py-1.5 ${l.ok ? "bg-emerald-50" : "bg-rose-50"}`}>
              <span className={l.ok ? "text-emerald-700" : "text-rose-700"}>{l.ok ? "" : ""}</span>{" "}
              <b>{PLATFORMS.find((p) => p.key === l.platform)?.label ?? l.platform}</b> → <span dir="ltr">{l.target}</sp
an>
              <div className="text-[10px] text-slate-600">{l.detail}</div>
              <span className="text-[10px] text-slate-400">{tehranDateTime(l.createdAt)}</span>
            </div>
          ))}
          {logs.length === 0 ? <p className="text-slate-400">    </p> : null}
        </div>
      </Card>
    </div>
  );
}
