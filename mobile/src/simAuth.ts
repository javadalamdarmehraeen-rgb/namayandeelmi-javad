/**
 * ============================================================
 *       — React Native
 * ------------------------------------------------------------
 *     :
 *   «»       
 *  (    )  MSISDN    .
 *   iOS    API    .
 *
 *       :
 *   )      (   )
 *   )  «  » (ICCID/IMSI/)   
 *           
 *   )     →        
 *      (       )
 * ============================================================
 */
import { NativeModules, PermissionsAndroid, Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import * as Keychain from "react-native-keychain";
import { HmacSHA256, enc } from "crypto-js";
//   
export const API_BASE = "https://namayandeelmi-javad.onrender.com";
/**    MOBILE_APP_SECRET     */
const APP_SECRET = "REPLACE_WITH_MOBILE_APP_SECRET";
const DEVICE_ID_KEY = "sek_device_id";
/* ------------------------------------------------------------------ */
/*                                                               */
/* ------------------------------------------------------------------ */

export async function requestSimPermissions(): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  try {
    const perms = [
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      //   +     
      "android.permission.READ_PHONE_NUMBERS" as never,
    ];
    const result = await PermissionsAndroid.requestMultiple(perms);
    return Object.values(result).some((v) => v === PermissionsAndroid.RESULTS.GRANTED);
  } catch {
    return false;
  }
}
/* ------------------------------------------------------------------ */
/*                                                 */
/* ------------------------------------------------------------------ */
export type SimInfo = {
  /**  —     (  ) */
  phoneNumber: string;
  /**        */
  fingerprint: string;
  carrier: string;
  simCount: number;
  hasSim: boolean;
  source: "line1" | "subscription" | "fallback" | "none";
};
function normalizePhone(raw?: string | null): string {
  if (!raw) return "";
  let d = String(raw).replace(/\D/g, "");
  if (d.startsWith("0098")) d = "0" + d.slice(4);
  else if (d.startsWith("98") && d.length === 12) d = "0" + d.slice(2);
  else if (d.length === 10 && d.startsWith("9")) d = "0" + d;
  return /^0\d{10}$/.test(d) ? d : "";
}
/**        */
export async function readSimInfo(): Promise<SimInfo> {
  const empty: SimInfo = {
    phoneNumber: "",
    fingerprint: "",
    carrier: "",
    simCount: 0,
    hasSim: false,
    source: "none",
  };
  if (Platform.OS !== "android") {
    // iOS:          
    const carrier = await DeviceInfo.getCarrier().catch(() => "");
    return { ...empty, carrier, hasSim: !!carrier, fingerprint: carrier ? `ios:${carrier}` : "" };
  }
  await requestSimPermissions();
  let phoneNumber = "";
  let fingerprint = "";
  let carrier = "";
  let simCount = 0;
  let source: SimInfo["source"] = "none";
  //  react-native-sim-data (  ) —  
  try {
    const SimData = NativeModules.RNSimData ?? require("react-native-sim-data").default;
    const info = await Promise.resolve(SimData?.getSimInfo?.());
    if (info) {
      const list = Array.isArray(info) ? info : Object.values(info);
      const first = (list[0] ?? info) as Record<string, unknown>;
      simCount = Array.isArray(list) ? list.length : 1;
      phoneNumber = normalizePhone(String(first.phoneNumber ?? first.number ?? ""));
      carrier = String(first.carrierName ?? first.displayName ?? "");
      const iccid = String(first.simSerialNumber ?? first.iccId ?? "");
      const imsi = String(first.subscriberId ?? "");
      const mccmnc = `${first.mcc ?? ""}${first.mnc ?? ""}`;
      fingerprint = iccid || imsi || `${carrier}:${mccmnc}`;
      if (phoneNumber) source = "subscription";
    }
  } catch {
    /*       */
  }

  //  react-native-device-info  
  if (!carrier) carrier = await DeviceInfo.getCarrier().catch(() => "");
  if (!phoneNumber) {
    const p = await DeviceInfo.getPhoneNumber?.().catch(() => "");
    const n = normalizePhone(p);
    if (n) {
      phoneNumber = n;
      source = "line1";
    }
  }
  if (!fingerprint && carrier) {
    fingerprint = `${carrier}:${await DeviceInfo.getUniqueId().catch(() => "")}`;
    source = source === "none" ? "fallback" : source;
  }
  return {
    phoneNumber,
    fingerprint,
    carrier,
    simCount: simCount || (carrier ? 1 : 0),
    hasSim: !!carrier || !!fingerprint,
    source,
  };
}
/* ------------------------------------------------------------------ */
/*     ( Keychain   )                  */
/* ------------------------------------------------------------------ */
export async function getDeviceId(): Promise<string> {
  try {
    const saved = await Keychain.getGenericPassword({ service: DEVICE_ID_KEY });
    if (saved && saved.password) return saved.password;
  } catch {
    /* ignore */
  }
  const fresh = (await DeviceInfo.getUniqueId().catch(() => "")) || `${Date.now().toString(36)}${Math.random().toString(
36).slice(2)}`;
  const id = String(fresh).replace(/[^a-zA-Z0-9]/g, "").slice(0, 60);
  try {
    await Keychain.setGenericPassword(DEVICE_ID_KEY, id, { service: DEVICE_ID_KEY });
  } catch {
    /* ignore */
  }
  return id;
}
export async function getDeviceInfoLabel(): Promise<string> {
  const brand = await DeviceInfo.getBrand().catch(() => "");
  const model = await DeviceInfo.getModel().catch(() => "");
  const os = `${Platform.OS} ${await DeviceInfo.getSystemVersion().catch(() => "")}`;
  return `${brand} ${model} — ${os}`.trim().slice(0, 200);
}
/* ------------------------------------------------------------------ */
/*                                                         */
/* ------------------------------------------------------------------ */
function base64url(input: string) {
  return input.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function sign(canonical: string) {
  return base64url(HmacSHA256(canonical, APP_SECRET).toString(enc.Base64));
}
async function fetchJson(path: string, body: unknown, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(timer);
  }
}
/* ------------------------------------------------------------------ */
/*                                                   */

/* ------------------------------------------------------------------ */
export type LoginResult =
  | { status: "success"; token: string; user: Record<string, unknown> }
  | { status: "need-otp"; message: string; masked?: string }
  | { status: "error"; message: string; code?: string };
export async function loginWithSim(): Promise<LoginResult> {
  const sim = await readSimInfo();
  const deviceId = await getDeviceId();
  const deviceInfo = await getDeviceInfoLabel();
  if (!sim.hasSim) {
    return { status: "error", message: "     .     .", code: "NO_SIM" }
;
  }
  //   nonce  ( Replay Attack)
  const nonceRes = await fetchJson("/api/mobile/nonce", { deviceId }).catch(() => null);
  if (!nonceRes?.ok) {
    return { status: "error", message: "    .     ." };
  }
  const nonce = String(nonceRes.data.nonce);
  //           
  const timestamp = Number(nonceRes.data.serverTime ?? Date.now());
  //   
  const canonical = [nonce, String(timestamp), deviceId, sim.phoneNumber, sim.fingerprint].join("|");
  const signature = sign(canonical);
  //    
  const res = await fetchJson("/api/mobile/login-with-phone", {
    deviceId,
    deviceInfo,
    nonce,
    timestamp,
    signature,
    phoneNumber: sim.phoneNumber,
    simFingerprint: sim.fingerprint,
    simCarrier: sim.carrier,
    simCount: sim.simCount,
  }).catch(() => null);
  if (!res) return { status: "error", message: "    ." };
  if (res.ok && res.data.token) {
    await Keychain.setGenericPassword("token", String(res.data.token), { service: "sek_token" });
    return { status: "success", token: String(res.data.token), user: res.data.user };
  }
  if (res.data.needOtp) {
    return { status: "need-otp", message: String(res.data.error ?? ""), masked: res.data.masked };
  }
  return { status: "error", message: String(res.data.error ?? "  "), code: res.data.code };
}
/* ------------------------------------------------------------------ */
/*      (    )                 */
/* ------------------------------------------------------------------ */
export async function requestOtp(username: string, password: string) {
  const deviceId = await getDeviceId();
  const res = await fetchJson("/api/auth/otp", { action: "request", username, password, deviceId });
  return { ok: res.ok, message: String(res.data.message ?? res.data.error ?? ""), masked: res.data.masked };
}
export async function verifyOtp(username: string, password: string, code: string) {
  const deviceId = await getDeviceId();
  const deviceInfo = await getDeviceInfoLabel();
  const res = await fetchJson("/api/auth/otp", {
    action: "verify",
    username,
    password,
    code,
    deviceId,
    deviceInfo,
  });
  if (res.ok && res.data.token) {
    await Keychain.setGenericPassword("token", String(res.data.token), { service: "sek_token" });
    return { ok: true, token: String(res.data.token), user: res.data.user };
  }
  return { ok: false, message: String(res.data.error ?? "  ") };
}

export async function getSavedToken(): Promise<string | null> {
  try {
    const c = await Keychain.getGenericPassword({ service: "sek_token" });
    return c ? c.password : null;
  } catch {
    return null;
  }
}
