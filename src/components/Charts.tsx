"use client";
import { toPersianDigits } from "@/lib/jalali";
export type Series = { label: string; value: number; color?: string };
const PALETTE = ["#0d9488", "#0ea5e9", "#6366f1", "#f59e0b", "#e11d48", "#8b5cf6", "#10b981", "#f97316"];
export function BarChart({ data, height = 180, unit = "" }: { data: Series[]; height?: number; unit?: string }) {
  if (data.length === 0) return <Empty />;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="scroll-x">
      <div className="flex items-end gap-2" style={{ height, minWidth: data.length * 52 }}>
        {data.map((d, i) => {
          const h = Math.max(4, (d.value / max) * (height - 34));
          return (
            <div key={`${d.label}-${i}`} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[10px] font-black text-slate-700">{toPersianDigits(d.value)}</span>
              <div
                className="w-full rounded-t-lg transition-all"
                style={{ height: h, background: d.color ?? PALETTE[i % PALETTE.length], minWidth: 26 }}
                title={`${d.label}: ${d.value}${unit}`}
              />
              <span className="w-full truncate text-center text-[9px] text-slate-500" title={d.label}>
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
/**    (   ) */
export function LineChart({
  labels,
  series,
  height = 200,
}: {
  labels: string[];
  series: { name: string; values: number[]; color?: string }[];
  height?: number;
}) {
  if (labels.length === 0 || series.length === 0) return <Empty />;
  const W = Math.max(320, labels.length * 46);
  const H = height;
  const pad = { t: 12, r: 8, b: 24, l: 34 };
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, labels.length - 1);
  const y = (v: number) => H - pad.b - (v / max) * (H - pad.t - pad.b);
  return (
    <div className="scroll-x">
      <svg width={W} height={H} className="min-w-full">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={pad.l} x2={W - pad.r} y1={y(max * f)} y2={y(max * f)} stroke="#e2e8f0" strokeWidth={1} />
            <text x={4} y={y(max * f) + 4} fontSize={9} fill="#94a3b8">
              {toPersianDigits(Math.round(max * f))}
            </text>
          </g>
        ))}
        {series.map((s, si) => {
          const color = s.color ?? PALETTE[si % PALETTE.length];
          const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
          return (
            <g key={s.name}>
              <polyline points={pts} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
              {s.values.map((v, i) => (
                <circle key={i} cx={x(i)} cy={y(v)} r={3} fill={color}>
                  <title>{`${s.name} — ${labels[i]}: ${v}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
        {labels.map((l, i) => (
          <text key={i} x={x(i)} y={H - 6} fontSize={9} fill="#64748b" textAnchor="middle">
            {l}
          </text>
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap gap-2">

        {series.map((s, i) => (
          <span key={s.name} className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ background: s.color ?? PALETTE[i % PALETTE.length] }}
            />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
export function DonutChart({ data, size = 150 }: { data: Series[]; size?: number }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  if (total === 0) return <Empty />;
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <svg width={size} height={size}>
        <g transform={`translate(${size / 2},${size / 2}) rotate(-90)`}>
          {data.map((d, i) => {
            const frac = d.value / total;
            const dash = `${frac * c} ${c}`;
            const off = -acc * c;
            acc += frac;
            return (
              <circle
                key={d.label}
                r={r}
                fill="none"
                stroke={d.color ?? PALETTE[i % PALETTE.length]}
                strokeWidth={18}
                strokeDasharray={dash}
                strokeDashoffset={off}
              >
                <title>{`${d.label}: ${d.value}`}</title>
              </circle>
            );
          })}
        </g>
        <text x="50%" y="50%" textAnchor="middle" dy="4" fontSize={14} fontWeight="bold" fill="#0f766e">
          {toPersianDigits(total)}
        </text>
      </svg>
      <div className="space-y-1">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-1.5 text-[11px]">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ background: d.color ?? PALETTE[i % PALETTE.length] }}
            />
            <span className="font-bold text-slate-700">{d.label}</span>
            <span className="text-slate-500">{toPersianDigits(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function Empty() {
  return <p className="py-8 text-center text-xs text-slate-400">    </p>;
}
