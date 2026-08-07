/**
 * صفحه ورود اپلیکیشن موبایل «ثبت اطلاعات کل»
 * React Native — با خواندن خودکار سیم‌کارت و برگشت به کد پیامکی
 */
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  I18nManager,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import {
  API_BASE,
  getSavedToken,
  loginWithSim,
  readSimInfo,
  requestOtp,
  verifyOtp,
  type SimInfo,
} from "./src/simAuth";

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

type Screen = "loading" | "sim" | "credentials" | "otp" | "app";

export default function App() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [sim, setSim] = useState<SimInfo | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [masked, setMasked] = useState("");

  /* ---------- شروع: تلاش برای ورود خودکار با سیم‌کارت ---------- */
  useEffect(() => {
    (async () => {
      const saved = await getSavedToken();
      if (saved) {
        setToken(saved);
        setScreen("app");
        return;
      }
      const info = await readSimInfo();
      setSim(info);

      if (!info.hasSim) {
        setMsg("⚠️ سیم‌کارتی در این گوشی شناسایی نشد. لطفاً سیم‌کارت را بررسی کنید.");
        setScreen("credentials");
        return;
      }

      if (!info.phoneNumber) {
        // اپراتور شماره را روی سیم‌کارت ننوشته → مسیر کد پیامکی
        setMsg(
          `سیم‌کارت ${info.carrier || ""} شناسایی شد، اما اپراتور شماره را روی سیم‌کارت ذخیره نکرده است.\n` +
            "برای تایید، با نام کاربری وارد شوید تا کد پیامکی برایتان ارسال شود.",
        );
        setScreen("credentials");
        return;
      }

      setBusy(true);
      const res = await loginWithSim();
      setBusy(false);

      if (res.status === "success") {
        setToken(res.token);
        setScreen("app");
      } else if (res.status === "need-otp") {
        setMsg(res.message);
        setMasked(res.masked ?? "");
        setScreen("credentials");
      } else {
        setMsg(res.message);
        setScreen("credentials");
      }
    })();
  }, []);

  const doRequestOtp = async () => {
    if (!username || !password) return Alert.alert("خطا", "نام کاربری و رمز عبور را وارد کنید");
    setBusy(true);
    const r = await requestOtp(username, password);
    setBusy(false);
    setMsg(r.message);
    if (r.masked) setMasked(r.masked);
    if (r.ok) setScreen("otp");
  };

  const doVerifyOtp = async () => {
    setBusy(true);
    const r = await verifyOtp(username, password, code);
    setBusy(false);
    if (r.ok && r.token) {
      setToken(r.token);
      setScreen("app");
    } else setMsg(r.message ?? "کد نامعتبر است");
  };

  /* ---------- برنامه اصلی داخل WebView با توکن ---------- */
  if (screen === "app" && token) {
    return (
      <SafeAreaView style={styles.flex}>
        <WebView
          source={{ uri: `${API_BASE}/panel` }}
          injectedJavaScriptBeforeContentLoaded={`
            try {
              sessionStorage.setItem('sek_token', ${JSON.stringify(token)});
              localStorage.setItem('sek_token_p', ${JSON.stringify(token)});
            } catch (e) {}
            true;
          `}
          startInLoadingState
          geolocationEnabled
          domStorageEnabled
          javaScriptEnabled
          allowsBackForwardNavigationGestures
        />
      </SafeAreaView>
    );
  }

  if (screen === "loading" || busy) {
    return (
      <SafeAreaView style={[styles.flex, styles.center]}>
        <ActivityIndicator size="large" color="#0f766e" />
        <Text style={styles.hint}>در حال بررسی سیم‌کارت...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>ثبت اطلاعات کل</Text>
        <Text style={styles.sub}>ورود نماینده علمی</Text>

        {sim ? (
          <View style={styles.simBox}>
            <Text style={styles.simText}>
              {sim.hasSim ? "✅" : "⚠️"} سیم‌کارت: {sim.carrier || "نامشخص"}
              {sim.phoneNumber ? ` — ${sim.phoneNumber}` : " (شماره روی سیم‌کارت ذخیره نشده)"}
            </Text>
          </View>
        ) : null}

        {msg ? <Text style={styles.msg}>{msg}</Text> : null}

        {screen === "credentials" ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="نام کاربری"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="رمز عبور"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity style={styles.btn} onPress={doRequestOtp}>
              <Text style={styles.btnText}>📩 دریافت کد تایید پیامکی</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnGhost]}
              onPress={async () => {
                setBusy(true);
                const r = await loginWithSim();
                setBusy(false);
                if (r.status === "success") {
                  setToken(r.token);
                  setScreen("app");
                } else setMsg(r.message);
              }}
            >
              <Text style={styles.btnGhostText}>🔄 تلاش مجدد با سیم‌کارت</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {screen === "otp" ? (
          <>
            <Text style={styles.hint}>کد ارسال‌شده به {masked} را وارد کنید</Text>
            <TextInput
              style={[styles.input, styles.code]}
              placeholder="_ _ _ _ _"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
            />
            <TouchableOpacity style={styles.btn} onPress={doVerifyOtp}>
              <Text style={styles.btnText}>✅ تایید و ورود</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f1f5f9" },
  center: { justifyContent: "center", alignItems: "center" },
  container: { padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: "bold", color: "#0f766e", textAlign: "center", marginTop: 40 },
  sub: { fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 12 },
  simBox: { backgroundColor: "#fff", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  simText: { fontSize: 12, color: "#334155", textAlign: "right" },
  msg: { fontSize: 12, color: "#b45309", backgroundColor: "#fffbeb", padding: 12, borderRadius: 12, textAlign: "right", lineHeight: 22 },
  input: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#cbd5e1", padding: 14, fontSize: 14, textAlign: "right" },
  code: { textAlign: "center", fontSize: 22, letterSpacing: 8 },
  btn: { backgroundColor: "#0f766e", borderRadius: 14, padding: 15, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  btnGhost: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#0f766e" },
  btnGhostText: { color: "#0f766e", fontWeight: "bold", fontSize: 14 },
  hint: { fontSize: 12, color: "#64748b", textAlign: "center", marginTop: 8 },
});
