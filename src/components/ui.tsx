"use client";
import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl bg-white/95 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.05)] ring-1 ring-slate-200/90 backdrop-
blur-sm transition-shadow hover:shadow-[0_12px_36px_rgba(15,23,42,0.075)] sm:p-5 ${className}`}
    >

      {children}
    </div>
  );
}
export function SectionTitle({ children, icon }: { children: ReactNode; icon?: string }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-800 sm:text-lg">
      {icon ? <span className="text-xl">{icon}</span> : null}
      {children}
    </h2>
  );
}
export function Field({
  label,
  children,
  hint,
  required,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600 sm:text-sm">
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-slate-400">{hint}</span> : null}
    </label>
  );
}
const inputBase =
  "w-full rounded-xl border border-slate-300/90 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-[0_1px_2px_rgba(15,23
,42,0.03)] outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-teal-500 focus:ring-4 
focus:ring-teal-100/70 disabled:bg-slate-100";
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input {...rest} className={`${inputBase} ${className}`} />;
}
export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return <textarea {...rest} className={`${inputBase} min-h-[80px] resize-y ${className}`} />;
}
type BtnProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "danger" | "soft" | "success";
  disabled?: boolean;
  className?: string;
  title?: string;
};
export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
  className = "",
  title,
}: BtnProps) {
  const styles: Record<string, string> = {
    primary: "bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    ghost: "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50",
    soft: "bg-teal-50 text-teal-800 ring-1 ring-teal-200 hover:bg-teal-100",
  };
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disa
bled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}

    >
      {children}
    </button>
  );
}
export function Alert({ kind = "info", children }: { kind?: "info" | "error" | "success"; children: ReactNode }) {
  if (!children) return null;
  const map = {
    info: "bg-sky-50 text-sky-800 ring-sky-200",
    error: "bg-rose-50 text-rose-800 ring-rose-200",
    success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  };
  return (
    <div className={`fade-in rounded-xl px-3 py-2 text-sm font-medium ring-1 ${map[kind]}`}>{children}</div>
  );
}
export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "green" | "amber" }) {
  const map = {
    slate: "bg-slate-100 text-slate-600",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
  };
  return <span className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${map[tone]}`}>{children}</span>;
}
