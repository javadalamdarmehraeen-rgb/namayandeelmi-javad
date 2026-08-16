@echo off
setlocal EnableExtensions
chcp 65001 >nul
title SYNC ALL — GitHub + GitLab

REM ============================================================
REM  همگام‌سازی یک‌دستوری: pull ← commit ← push به گیت‌هاب و گیت‌لب
REM  روش استفاده:
REM     SYNC_ALL.bat توضیح تغییرات
REM  اگر توضیح ندهی، تاریخ/ساعت به‌عنوان پیام ثبت می‌شود.
REM  در لینوکس/مک معادل این فایل:  sh sync_all.sh توضیح تغییرات
REM ============================================================

cd /d "%~dp0"
if not exist ".git" (
  echo [خطا] پوشه .git اینجا نیست؛ این فایل باید داخل فولدر برنامه باشد.
  pause
  exit /b 1
)

set "MSG=%*"
if "%MSG%"=="" set "MSG=update %date% %time%"

echo.
echo --- 1^) گرفتن آخرین تغییرات از گیت‌هاب «pull» ---
git pull --no-rebase origin main
if errorlevel 1 (
  echo [توقف] pull از گیت‌هاب خطا داد؛ اگر «تعارض/merge conflict» دیدی باید دستی حل شود؛
  echo        بعد دوباره همین فایل را اجرا کن.
  pause
  exit /b 1
)

git remote get-url gitlab >nul 2>&1
if errorlevel 1 (
  echo [i] ریموت gitlab هنوز تنظیم نشده؛ فقط گیت‌هاب همگام می‌شود.
  echo     راهنمای یک‌بار تنظیم گیت‌لب: RAHNAMA_GITLAB.txt
) else (
  echo.
  echo --- 1b^) گرفتن آخرین تغییرات از گیت‌لب ---
  git pull --no-rebase gitlab main
  if errorlevel 1 (
    echo [توقف] pull از گیت‌لب خطا داد؛ تعارض را دستی حل کن و دوباره اجرا کن.
    pause
    exit /b 1
  )
)

echo.
echo --- 2^) ثبت تغییرات محلی ---
git add -A
git commit -m "%MSG%"
if errorlevel 1 echo [i] تغییر جدیدی برای ثبت نبود؛ ادامه می‌دهیم...

echo.
echo --- 3^) ارسال به گیت‌هاب ---
git push origin main
if errorlevel 1 (
  echo [خطا] push به گیت‌هاب رد شد؛ دوباره SYNC_ALL را اجرا کن تا اول pull شود.
  pause
  exit /b 1
)

git remote get-url gitlab >nul 2>&1
if errorlevel 1 (
  echo [i] push به گیت‌لب انجام نشد «ریموت gitlab تنظیم نشده است».
) else (
  echo.
  echo --- 4^) ارسال به گیت‌لب ---
  git push gitlab main
  if errorlevel 1 echo [هشدار] push به گیت‌لب رد شد؛ بعداً دستی بزن: git push gitlab main
)

echo.
echo --- تمام شد؛ گیت‌هاب و گیت‌لب همگام هستند ---
git status -sb
echo.
pause
