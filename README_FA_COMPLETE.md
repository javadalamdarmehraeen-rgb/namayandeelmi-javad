# 🏥 سامانه مدیریت ویزیت علمی و شبکه درمان - پکیج جامع Next.js + CRM (نسخه 2.5.2)

در این آپدیت (نسخه 2.5.2)، فایل حیاتی **`.gitignore`** به پکیج اضافه شد تا از خطای گیت‌هاب (`GH001: Large files detected` و آپلود فایل‌های سنگین پوشه `node_modules`) به طور کامل جلوگیری شود.

---

## 🔧 حل خطای گیت‌هاب (File exceeds GitHub's file size limit of 100.00 MB)

هنگامی که دستور `git push origin main` را اجرا کردید، گیت‌هاب با خطای زیر ارسال را رد کرد:
```text
remote: error: File node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node is 130.48 MB
remote: error: GH001: Large files detected.
```
علت این خطا این بود که پوشه سنگین **`node_modules`** در گیت شما ردیابی (Stage) شده بود، زیرا فایل **`.gitignore`** در پوشه وجود نداشت.

در این نسخه فایل **`.gitignore`** استاندارد Next.js در پکیج قرار گرفت تا گیت به طور خودکار پوشه‌های `node_modules` و `.next` را نادیده بگیرد.

---

## 🚀 دستورالعمل رفع خطا در Powershell و ارسال موفق به گیت‌هاب (فقط ۴ خط دستور)

1. فایل جدید **`namayandeelmi-javad-complete-package.zip`** را دانلود و Extract کنید.
2. تمامی فایل‌های استخراج‌شده (به‌ویژه فایل جدید **`.gitignore`**) را در فولدر پروژه خود جایگزین کنید:
   ```text
   E:\porozheha\list prozheha\namayandeelmi-javad
   ```
3. در ترمینال Powershell خود دستورات زیر را به ترتیب اجرا کنید تا کامیت قبلی لغو شده و نسخه سبک بدون `node_modules` ارسال شود:

```powershell
# ۱. لغو کامیت قبلی که فایل سنگین node_modules در آن بود (بدون حذف فایل‌های شما):
git reset --mixed origin/main

# ۲. خروج پوشه‌های سنگین از کش گیت (در صورتی که قبلاً ردیابی شده باشند):
git rm -r --cached node_modules
git rm -r --cached .next

# ۳. افزودن فایل‌ها (این بار با اعمال فایل .gitignore پوشه node_modules نادیده گرفته می‌شود):
git add .
git commit -m "Add .gitignore and deploy complete CRM application"
git push origin main
```

مشاهده خواهید کرد که این بار حجم ارسال بسیار کم است، گیت‌هاب کامیت را **بلافاصله با موفقیت تایید می‌کند (`100% done`)** و سرور **Render.com** پروژه را بیلد و اجرا خواهد کرد!
