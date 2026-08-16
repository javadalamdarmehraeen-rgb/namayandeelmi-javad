@echo off
setlocal EnableExtensions
chcp 65001 >nul
title ترمیم آپلود گیت‌هاب — ادغام امن و ارسال (PUSH FRESH)

REM ============================================================
REM  این فایل برای موقعی است که روی گیت‌هاب یک کامیت جدید دستی
REM  (مثل «پروژه اولیه») ساخته شده و push معمولی رد می‌شود.
REM  کارش: فایل‌های همین فولدر را ثبت می‌کند، با نسخه روی گیت‌هاب
REM  «ادغام امن» می‌کند (فایل‌های تو همیشه برنده‌اند) و push می‌کند.
REM  بعد از این یک‌بار، SYNC_ALL.bat مثل قبل کار می‌کند.
REM  روش استفاده: دابل‌کلیک، یا: PUSH_FRESH_GITHUB.bat توضیح تغییرات
REM ============================================================

cd /d "%~dp0"
if not exist ".git" (
  echo [خطا] این فایل باید داخل فولدر برنامه ^(کنار پوشه .git^) باشد.
  pause
  exit /b 1
)

set "MSG=%*"
if "%MSG%"=="" set "MSG=v11.16.1 %date% %time%"

echo.
echo --- 1^) ثبت فایل‌های فعلی همین فولدر ---
git add -A
git commit -m "%MSG%"
if errorlevel 1 echo [i] تغییر جدیدی برای ثبت نبود؛ ادامه می‌دهیم...

echo.
echo --- 2^) گرفتن وضعیت فعلی گیت‌هاب ---
git fetch origin
if errorlevel 1 (
  echo [خطا] ارتباط با گیت‌هاب برقرار نشد؛ اینترنت یا ورود گیت را چک کن.
  pause
  exit /b 1
)

echo.
echo --- 3^) ادغام یک‌باره با نسخه روی گیت‌هاب ---
echo     ^(تاریخچه‌ها جدا هستند؛ با allow-unrelated حل می‌شود و فایل‌های تو برنده‌اند^)
git merge --allow-unrelated-histories -X ours origin/main -m "merge with github initial"
if errorlevel 1 (
  echo [خطا] ادغام کامل نشد؛ عکس خطا را برای هوش مصنوعی بفرست.
  pause
  exit /b 1
)

echo.
echo --- 4^) ارسال به گیت‌هاب ---
git push origin main
if errorlevel 1 (
  echo [خطا] push رد شد؛ عکس خطا را برای هوش مصنوعی بفرست.
  pause
  exit /b 1
)

echo.
echo --- نتیجه: آخرین کامیت‌های روی گیت‌هاب ---
git log origin/main --oneline -3
echo.
echo تمام ✅ حالا صفحه گیت‌هاب را در مرورگر باز کن و Ctrl+F5 بزن؛
echo باید فایل‌های جدید را ببینی ^(مثل public/crm-features-v20.js و PROJECT_GRAPH.md^).
pause
