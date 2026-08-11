"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Button } from "./ui";
import { toPersianDigits } from "@/lib/jalali";
export type Att = {
  id: number;
  fileName: string;
  mimeType: string;
  size: number;
  repName?: string;
  ownerId?: number | null;
};
const fmtSize = (n: number) =>
  n > 1024 * 1024 ? `${toPersianDigits((n / 1024 / 1024).toFixed(1))} ` : `${toPersianDigits(Math.round(n / 1024)
)} `;
export function printFile(id: number, mime: string) {
  const url = `/api/attachments/${id}`;
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  const content = mime.startsWith("image/")
    ? `<img src="${url}" style="max-width:100%" onload="window.focus();window.print()"/>`
    : `<iframe src="${url}" style="border:0;width:100%;height:95vh" onload="window.focus();setTimeout(()=>window.print()
,600)"></iframe>`;
  w.document.write(
    `<html dir="rtl"><head><meta charset="utf-8"><title> </title></head><body style="margin:0">${content}</body><
/html>`,
  );
  w.document.close();
}
export function FileList({
  files,
  onDelete,
  compact = false,
}: {
  files: Att[];
  onDelete?: (id: number) => void;
  compact?: boolean;
}) {
  if (files.length === 0) return <p className="text-xs text-slate-400">   </p>;
  return (
    <div className={`grid gap-2 ${compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
      {files.map((f) => (

        <div key={f.id} className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200">
          {f.mimeType.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/attachments/${f.id}`}
              alt={f.fileName}
              className="mb-2 h-28 w-full cursor-pointer rounded-lg object-cover"
              onClick={() => window.open(`/api/attachments/${f.id}`, "_blank")}
            />
          ) : (
            <div className="mb-2 flex h-28 items-center justify-center rounded-lg bg-white text-3xl"></div>
          )}
          <div className="truncate text-[11px] font-bold text-slate-700" title={f.fileName}>
            {f.fileName}
          </div>
          <div className="text-[10px] text-slate-400">
            {fmtSize(f.size)} {f.repName ? `— ${f.repName}` : ""}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            <a
              href={`/api/attachments/${f.id}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-sky-100 px-2 py-1 text-[10px] font-bold text-sky-700"
            >
               
            </a>
            <a
              href={`/api/attachments/${f.id}?download=1`}
              className="rounded-lg bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700"
            >
               
            </a>
            <button
              onClick={() => printFile(f.id, f.mimeType)}
              className="rounded-lg bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700"
            >
               
            </button>
            {onDelete ? (
              <button
                onClick={() => onDelete(f.id)}
                className="rounded-lg bg-rose-100 px-2 py-1 text-[10px] font-bold text-rose-700"
              >
                
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
/**  /.            . */
export default function FileUploader({
  ownerType = "doctor",
  ownerId = null,
  onChangeIds,
}: {
  ownerType?: string;
  ownerId?: number | null;
  onChangeIds?: (ids: number[]) => void;
}) {
  const [files, setFiles] = useState<Att[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const cb = useRef(onChangeIds);
  cb.current = onChangeIds;
  useEffect(() => {
    cb.current?.(files.map((f) => f.id));
  }, [files]);
  const load = useCallback(async () => {
    if (!ownerId) return;
    const res = await fetch(`/api/attachments?ownerType=${ownerType}&ownerId=${ownerId}`, { cache: "no-store" });
    if (res.ok) setFiles((await res.json()).rows ?? []);
  }, [ownerType, ownerId]);
  useEffect(() => {
    load();
  }, [load]);

  const upload = async (list: FileList | null) => {
    if (!list?.length) return;
    setErr("");
    setBusy(true);
    for (const file of Array.from(list).slice(0, 5)) {
      if (file.size > 3 * 1024 * 1024) {
        setErr(`«${file.name}»     `);
        continue;
      }
      const data = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.readAsDataURL(file);
      });
      const res = await fetch("/api/attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerType, ownerId, fileName: file.name, data }),
      });
      if (res.ok) {
        const d = await res.json();
        setFiles((p) => [d.row, ...p]);
      } else {
        const d = await res.json().catch(() => ({}));
        setErr(d.error ?? "  ");
      }
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };
  const remove = async (id: number) => {
    await fetch(`/api/attachments?id=${id}`, { method: "DELETE" });
    setFiles((p) => p.filter((f) => f.id !== id));
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
          onChange={(e) => upload(e.target.files)}
          className="hidden"
          id={`file-${ownerType}`}
        />
        <Button variant="soft" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? "   ..." : "    "}
        </Button>
        <Badge tone="slate">{toPersianDigits(files.length)} </Badge>
        <span className="text-[11px] text-slate-400"> PDF   —   </span>
      </div>
      {err ? <p className="text-xs font-bold text-rose-600">{err}</p> : null}
      <FileList files={files} onDelete={remove} compact />
    </div>
  );
}
