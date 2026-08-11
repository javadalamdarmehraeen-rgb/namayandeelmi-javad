"use client";
import { usePathname, useRouter } from "next/navigation";
/**   —            */
export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const isRoot = pathname === "/panel" || pathname === "/admin" || pathname === "/login" || pathname === "/";
  const home = pathname.startsWith("/admin") ? "/admin" : "/panel";
  return (
    <div className="mb-3 flex items-center gap-2">
      <button
        onClick={() => {
          if (window.history.length > 1) router.back();
          else router.push(home);
        }}
        className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-
sm ring-1 ring-slate-200 hover:bg-slate-50"
        title="   "
      >
        <span className="text-base">→</span> 
      </button>
      {!isRoot ? (
        <button
          onClick={() => router.push(home)}
          className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-bold text-teal-700 shadow
-sm ring-1 ring-slate-200 hover:bg-teal-50"
          title=" "
        >
            
        </button>
      ) : null}
    </div>
  );
}
