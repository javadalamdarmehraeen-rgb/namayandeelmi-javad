# 📱 اپلیکیشن موبایل «ثبت اطلاعات کل»

## ⚠️ ابتدا این را بخوانید — واقعیت فنی خواندن شماره سیم‌کارت

| سیستم‌عامل | امکان خواندن شماره؟ | توضیح |
|---|---|---|
| **اندروید** | ❌ اغلب خیر | `getLine1Number()` فیلد MSISDN را از سیم‌کارت می‌خواند. **همراه اول و ایرانسل این فیلد را خالی می‌گذارند** → مقدار `null` یا رشته خالی برمی‌گردد. در اندروید ۱۳+ هم منسوخ شده است. |
| **iOS** | ❌ هرگز | اپل هیچ API برای خواندن شماره ندارد. اپ‌هایی که این کار را بکنند رد می‌شوند. |
| **اثر انگشت سیم‌کارت** | ✅ بله | نام اپراتور، MCC/MNC و (با مجوز) ICCID/IMSI قابل خواندن است و **تعویض سیم‌کارت را تشخیص می‌دهد**. |
| **کد پیامکی** | ✅ قطعی | تنها روش صددرصد مطمئن که ثابت می‌کند سیم‌کارت **داخل همان گوشی** است — همان کاری که واتساپ و تلگرام می‌کنند. |

بنابراین این اپ **سه لایه** دارد و به‌صورت خودکار بین آن‌ها جابه‌جا می‌شود:

```
۱) تلاش برای خواندن مستقیم شماره  →  اگر موفق شد: ورود آنی و بی‌صدا
۲) خواندن اثر انگشت سیم‌کارت      →  تشخیص تعویض سیم‌کارت / گوشی
۳) کد پیامکی                      →  وقتی شماره خوانده نشد (حالت غالب در ایران)
```

---

## ۱) ساخت پروژه و نصب کتابخانه‌ها

```bash
npx @react-native-community/cli init SabtEtelaatApp --version latest
cd SabtEtelaatApp

npm install \
  react-native-device-info \
  react-native-sim-data \
  react-native-keychain \
  react-native-webview \
  crypto-js

npm install -D @types/crypto-js

cd ios && pod install && cd ..    # فقط برای مک/iOS
```

سپس فایل‌های `App.tsx` و `src/simAuth.ts` این پوشه را در ریشه پروژه کپی کنید.

### مجوزهای اندروید
در `android/app/src/main/AndroidManifest.xml` داخل تگ `<manifest>`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.READ_PHONE_NUMBERS" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.RECEIVE_SMS" />
```

> `READ_PHONE_NUMBERS` برای اندروید ۱۱+ و `READ_PHONE_STATE` برای نسخه‌های قدیمی‌تر لازم است.
> هر دو **مجوز خطرناک** هستند و باید هنگام اجرا از کاربر گرفته شوند (کد این کار را انجام می‌دهد).

### تنظیم کلید مشترک
در فایل `src/simAuth.ts`:

```ts
export const API_BASE = "https://namayandeelmi-javad.onrender.com";
const APP_SECRET = "یک-کلید-تصادفی-طولانی";
```

و **همان مقدار** را در Render → Environment ثبت کنید:

```
MOBILE_APP_SECRET = یک-کلید-تصادفی-طولانی
```

---

## ۲) نحوه کار API

### دریافت nonce (ضد Replay Attack)
```http
POST /api/mobile/nonce
{ "deviceId": "abc123" }

→ { "nonce": "...", "ttlMs": 180000, "serverTime": 1730000000000 }
```

### ورود با شماره سیم‌کارت
```http
POST /api/mobile/login-with-phone
{
  "deviceId": "abc123",
  "deviceInfo": "Samsung A52 — android 13",
  "nonce": "...",
  "timestamp": 1730000000000,
  "signature": "HMAC-SHA256(nonce|timestamp|deviceId|phone|simFingerprint)",
  "phoneNumber": "09121234567",
  "simFingerprint": "89981...",
  "simCarrier": "Irancell"
}
```

**پاسخ‌ها:**

| کد | معنی | اقدام اپ |
|---|---|---|
| `200` | ورود موفق | ذخیره توکن و ورود |
| `422 SIM_NUMBER_UNAVAILABLE` | شماره روی سیم‌کارت نبود | رفتن به مسیر کد پیامکی |
| `404 PHONE_NOT_REGISTERED` | «این شماره در سیستم ثبت نشده است» | نمایش پیام |
| `403 DEVICE_MISMATCH` | حساب به گوشی دیگری قفل است | پیشنهاد تایید پیامکی |
| `403 SIM_CHANGED` | سیم‌کارت گوشی عوض شده | تایید پیامکی |
| `403 PASSWORD_LOGIN_REQUIRED` | تایید شماره برای این کاربر غیرفعال است | ورود با نام کاربری |
| `401 BAD_SIGNATURE / BAD_NONCE` | درخواست جعلی یا تکراری | تلاش مجدد |

### ورود با کد پیامکی
```http
POST /api/auth/otp   { "action":"request", "username", "password", "deviceId" }
POST /api/auth/otp   { "action":"verify",  "username", "password", "code", "deviceId", "deviceInfo" }
→ { token, user }
```

---

## ۳) تنظیمات سمت مدیر (پنل وب)

در صفحه **کاربران و دسترسی**، برای هر کاربر:

| گزینه | معادل درخواست شما | رفتار |
|---|---|---|
| `شماره اجباری` روشن/خاموش | `isPhoneVerificationRequired` | اگر خاموش باشد، اپ پیام «ورود با نام کاربری» می‌دهد |
| کنترل سیم‌کارت: **بدون بررسی** | — | هیچ کنترلی انجام نمی‌شود |
| کنترل سیم‌کارت: **تطبیق شماره** | — | فقط شماره باید یکی باشد |
| کنترل سیم‌کارت: **قفل گوشی** | — | حساب به اولین گوشی قفل می‌شود |
| کنترل سیم‌کارت: **تایید پیامکی** | — | همیشه کد پیامکی لازم است |
| دکمه **آزادسازی گوشی** | — | اجازه تعویض دستگاه |

---

## ۴) تست

### شبیه‌ساز اندروید
```bash
npx react-native run-android
```
- شبیه‌ساز شماره تستی `15555215554` دارد؛ برای تست مسیر «شماره ناموجود» عالی است.
- برای تست کد پیامکی: چون پنل پیامکی تنظیم نشده، کد به **اعلان مدیر** در پنل وب می‌رود.
- تست دستی API:
```bash
curl -X POST https://<app>/api/mobile/nonce -H 'Content-Type: application/json' -d '{"deviceId":"testdev"}'
```

### گوشی واقعی
```bash
npx react-native run-android --device
```
۱. اپ را باز کنید → مجوز «تلفن» را بدهید.
۲. اگر اپراتور شماره را ذخیره کرده باشد → ورود آنی.
۳. در غیر این صورت → نام کاربری/رمز → کد پیامکی → ورود و **قفل شدن گوشی**.
۴. سیم‌کارت را در گوشی دیگری بگذارید → باید خطای `DEVICE_MISMATCH` بگیرید.

### حالت توسعه (بدون امضا)
برای تست سریع بدون HMAC، در Render موقتاً:
```
MOBILE_ALLOW_UNSIGNED = 1
```
> ⚠️ حتماً در محیط عملیاتی حذف کنید.

---

## ۵) ساخت خروجی نصبی

```bash
cd android && ./gradlew assembleRelease
# خروجی: android/app/build/outputs/apk/release/app-release.apk
```

> اگر نمی‌خواهید با React Native کار کنید، همان نسخه وب (PWA) از مسیر `/install`
> روی گوشی نصب می‌شود و همه امکانات جز «خواندن خودکار شماره» را دارد.

---

## نسخه Flutter (معادل)

```yaml
# pubspec.yaml
dependencies:
  sim_data: ^0.0.6          # خواندن اطلاعات سیم‌کارت (اندروید)
  device_info_plus: ^10.0.0
  flutter_secure_storage: ^9.0.0
  crypto: ^3.0.3
  http: ^1.2.0
  permission_handler: ^11.0.0
```

```dart
import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import 'package:sim_data/sim_data.dart';
import 'package:permission_handler/permission_handler.dart';

const apiBase = 'https://namayandeelmi-javad.onrender.com';
const appSecret = 'REPLACE_WITH_MOBILE_APP_SECRET';

String _sign(String canonical) =>
    base64Url.encode(Hmac(sha256, utf8.encode(appSecret))
        .convert(utf8.encode(canonical)).bytes).replaceAll('=', '');

Future<Map<String, dynamic>> loginWithSim(String deviceId, String deviceInfo) async {
  await Permission.phone.request();

  String phone = '';
  String fingerprint = '';
  String carrier = '';
  try {
    final data = await SimDataPlugin.getSimData();
    if (data.cards.isNotEmpty) {
      final c = data.cards.first;
      phone = c.phoneNumber ?? '';
      carrier = c.carrierName ?? '';
      fingerprint = '${c.mcc}${c.mnc}:$carrier';
    }
  } catch (_) {}

  // ۱) دریافت nonce
  final n = await http.post(Uri.parse('$apiBase/api/mobile/nonce'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'deviceId': deviceId}));
  final nd = jsonDecode(n.body);
  final nonce = nd['nonce'];
  final ts = nd['serverTime'];

  // ۲) امضا
  final signature = _sign('$nonce|$ts|$deviceId|$phone|$fingerprint');

  // ۳) ورود
  final res = await http.post(Uri.parse('$apiBase/api/mobile/login-with-phone'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'deviceId': deviceId, 'deviceInfo': deviceInfo,
        'nonce': nonce, 'timestamp': ts, 'signature': signature,
        'phoneNumber': phone, 'simFingerprint': fingerprint, 'simCarrier': carrier,
      }));
  return jsonDecode(res.body) as Map<String, dynamic>;
}
```
