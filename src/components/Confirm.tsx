"use client";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
type Opts = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};
type Ctx = (o: Opts) => Promise<boolean>;
const ConfirmCtx = createContext<Ctx>(async () => true);
/**  : `const confirm = useConfirm(); if (!(await confirm({title:'...'}))) return;` */
export function useConfirm() {
  return useContext(ConfirmCtx);
}
export default function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(Opts & { resolve: (v: boolean) => void }) | null>(null);
  const confirm = useCallback<Ctx>(
    (o) => new Promise<boolean>((resolve) => setState({ ...o, resolve })),
    [],
  );
  const close = (v: boolean) => {
    state?.resolve(v);
    setState(null);
  };
  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/60 p-0 sm:items-center sm:p-4"
          onClick={() => close(false)}
        >
          <div
            className="fade-in w-full max-w-sm rounded-t-3xl bg-white p-4 shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-start gap-3">
              <span className={`text-2xl ${state.danger ? "" : ""}`}>{state.danger ? "" : ""}</span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-black text-slate-800">{state.title}</h3>
                {state.message ? (
                  <p className="mt-1 whitespace-pre-wrap text-xs leading-6 text-slate-600">{state.message}</p>
                ) : null}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => close(true)}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white ${
                  state.danger ? "bg-rose-600 hover:bg-rose-700" : "bg-teal-600 hover:bg-teal-700"
                }`}
              >
                {state.confirmText ?? ""}
              </button>
              <button

                onClick={() => close(false)}
                className="flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-300
 hover:bg-slate-50"
              >
                {state.cancelText ?? ""}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmCtx.Provider>
  );
}
