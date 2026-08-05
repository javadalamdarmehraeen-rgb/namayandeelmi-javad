"use client";

export type SimStatus = {
  ok: boolean;
  cellular: boolean;
  online: boolean;
  reason: string;
  detail: string;
  type: string;
};

type Conn = {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (e: string, cb: () => void) => void;
  removeEventListener?: (e: string, cb: () => void) => void;
};

function conn(): Conn | undefined {
  const n = navigator as Navigator & { connection?: Conn; mozConnection?: Conn; webkitConnection?: Conn };
  return n.connection ?? n.mozConnection ?? n.webkitConnection;
}

export function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(navigator.userAgent);
}

/**
 * وضعیت سیم‌کارت/شبکه دستگاه.
 * روی موبایل، نوع اتصال (cellular / wifi) از Network Information API خوانده می‌شود.
 */
export function readSimStatus(): SimStatus {
  const online = typeof navigator !== "undefined" ? navigator.onLine : true;
  const c = conn();
  const type = c?.type ?? "unknown";
  const cellular = type === "cellular";

  if (!online) {
    return {
      ok: false,
      cellular: false,
      online: false,
      type,
      reason: "offline",
      detail: "⚠️ دستگاه به هیچ شبکه‌ای متصل نیست. سیم‌کارت یا وای‌فای را روشن کنید.",
    };
  }
  if (type === "none") {
    return {
      ok: false,
      cellular: false,
      online: true,
      type,
      reason: "no-network",
      detail: "⚠️ هیچ شبکه فعالی روی این دستگاه شناسایی نشد.",
    };
  }
  return { ok: true, cellular, online: true, type, reason: "", detail: "" };
}

export function watchSim(cb: (s: SimStatus) => void) {
  const emit = () => cb(readSimStatus());
  emit();
  window.addEventListener("online", emit);
  window.addEventListener("offline", emit);
  const c = conn();
  c?.addEventListener?.("change", emit);
  return () => {
    window.removeEventListener("online", emit);
    window.removeEventListener("offline", emit);
    c?.removeEventListener?.("change", emit);
  };
}

const DEVICE_KEY = "sek_device_sim";

/** شماره سیم‌کارت تاییدشده روی همین دستگاه (پس از اولین ورود موفق ذخیره می‌شود) */
export function getDeviceSim(): string {
  try {
    return localStorage.getItem(DEVICE_KEY) ?? "";
  } catch {
    return "";
  }
}
export function setDeviceSim(phone: string) {
  try {
    localStorage.setItem(DEVICE_KEY, phone);
  } catch {
    /* ignore */
  }
}

export function normalizePhone(p: string) {
  return String(p ?? "")
    .replace(/[\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, "")
    .replace(/^0098/, "0")
    .replace(/^98/, "0");
}
