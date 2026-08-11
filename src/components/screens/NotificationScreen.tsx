"use client";
import { useCallback, useEffect, useState } from "react";

import { Alert, Badge, Button, Card, Field, Input, SectionTitle, TextArea } from "@/components/ui";
import { useSession } from "@/components/SessionProvider";
import { tehranDateTime, toPersianDigits } from "@/lib/jalali";
import { useLive } from "@/lib/useLive";
import { useConfirm } from "@/components/Confirm";
type N = {
  id: number;
  title: string;
  body: string;
  fromName: string;
  kind: string;
  readAt: string | null;
  createdAt: string;
};
type U = { id: number; fullName: string; role: string };
export default function NotificationScreen() {
  const { me } = useSession();
  const [rows, setRows] = useState<N[]>([]);
  const [users, setUsers] = useState<U[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [to, setTo] = useState("0");
  const [msg, setMsg] = useState("");
  const confirm = useConfirm();
  const load = useCallback(async () => {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    if (res.ok) setRows((await res.json()).rows ?? []);
  }, []);
  useLive(load, 15000);
  useEffect(() => {
    if (me && me.role !== "rep") {
      fetch("/api/users", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setUsers(d?.rows ?? []))
        .catch(() => undefined);
    }
  }, [me]);
  const send = async () => {
    if (!title.trim()) return;
    if (
      !(await confirm({
        title: " ",
        message: isRep ? "    " : Number(to) ? "     " : "   
  ",
        confirmText: "",
      }))
    )
      return;
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, toUserId: Number(to) || 0 }),
    });
    if (res.ok) {
      setMsg("   ");
      setTitle("");
      setBody("");
      load();
    } else setMsg("  ");
  };
  const markAll = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    load();
  };
  const isRep = me?.role === "rep";
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle icon="">  </SectionTitle>
        <Button variant="ghost" onClick={markAll}>
           
        </Button>

      </div>
      {msg ? <Alert kind="success">{msg}</Alert> : null}
      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">
          {isRep ? "   " : "   "}
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label=" ">
            <TextArea value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
          {!isRep ? (
            <Field label="">
              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              >
                <option value="0"> </option>
                {users
                  .filter((u) => u.role === "rep")
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName}
                    </option>
                  ))}
              </select>
            </Field>
          ) : null}
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={send}> </Button>
        </div>
      </Card>
      <Card>
        <div className="space-y-2">
          {rows.length === 0 ? <p className="text-sm text-slate-400">  </p> : null}
          {rows.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl px-3 py-2 text-sm ${n.readAt ? "bg-slate-50" : "bg-teal-50 ring-1 ring-teal-200"}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-800">{n.title}</span>
                {!n.readAt ? <Badge tone="green"></Badge> : null}
                <span className="mr-auto text-[10px] text-slate-400">{tehranDateTime(n.createdAt)}</span>
              </div>
              {n.body ? <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{n.body}</p> : null}
              {n.fromName ? <p className="text-[10px] text-slate-400">: {n.fromName}</p> : null}
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-400"> : {toPersianDigits(rows.length)}</p>
      </Card>
    </div>
  );
}
