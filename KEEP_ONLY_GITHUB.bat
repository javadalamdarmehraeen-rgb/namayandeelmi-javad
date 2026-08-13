@echo off
setlocal EnableExtensions
chcp 65001 >nul
title فقط فایل‌های گیت‌هاب بماند

cd /d "E:\porozheha\list prozheha\namayandeelmi-javad" 2>nul
if not exist ".git" cd /d "E:\prozheha\list prozheha\namayandeelmi-javad" 2>nul
if not exist ".git" (
  echo این اسکریپت را داخل فولدر برنامه بگذار یا مسیر را درست کن.
  echo الان اینجایی: %CD%
  pause
  exit /b 1
)

echo.
echo فولدر: %CD%
echo کار این دستور:
echo   1^) فایل‌های برنامه را عین گیت‌هاب main می‌کند
echo   2^) هر فایل/فولدر اضافه که در گیت نیست را حذف می‌کند
echo نگه می‌دارد: .git   .env   node_modules   crm-backup
echo.
echo اگر چیزی را ذخیره نکرده‌ای و هنوز پوش نکرده‌ای، از بین می‌رود.
echo.

where git >nul 2>&1
if errorlevel 1 (
  echo git پیدا نشد.
  pause
  exit /b 1
)

echo --- همگام با گیت‌هاب ---
git fetch origin
if errorlevel 1 (
  echo fetch خطا داد. اینترنت / ورود گیت‌هاب را چک کن.
  pause
  exit /b 1
)

echo.
echo --- وضعیت فعلی ---
git status -sb
echo.
echo --- فایل‌های اضافه ^(هنوز حذف نشده^) ---
git clean -nd
echo.
echo اگر بالا چیزی نیامد یعنی فایل اضافهٔ بدون‌گیت نیست.
echo.
set "OK="
set /p OK=ادامه و حذف واقعی؟ فقط حرف Y را بزن: 
if /I not "%OK%"=="Y" (
  echo لغو شد. هیچ فایلی پاک نشد.
  pause
  exit /b 0
)

echo.
echo --- یکسان‌سازی با origin/main ---
git reset --hard origin/main
if errorlevel 1 (
  echo reset خطا داد.
  pause
  exit /b 1
)

echo.
echo --- حذف فایل و فولدر اضافه ---
git clean -fd
echo.

echo --- زباله‌های نادیده‌گرفته‌شده ^(env و node_modules نمی‌روند^) ---
git clean -fdx -e .env -e .env.local -e .env.ndcohub -e .env.production -e node_modules -e crm-backup-latest.json -e "crm-backup*.json"

echo.
echo --- بعد از پاکسازی ---
git status -sb
echo.
echo تمام. فولدر باید فقط فایل‌های گیت‌هاب باشد.
echo در مرورگر Ctrl+F5 بزن.
pause
