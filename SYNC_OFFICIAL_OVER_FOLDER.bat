@echo off
setlocal EnableExtensions
chcp 65001 >nul
title جایگزینی فایل‌های رسمی + حذف اضافی
cd /d "%~dp0"

echo.
echo این اسکریپت:
echo   1) فایل‌های رسمی همین بسته را روی فولدر هدف کپی می‌کند
echo   2) هر فایلی که در نسخه فعلی نیست را از هدف حذف می‌کند
echo   .git و .env و node_modules حفظ می‌شوند
echo.

set "TARGET=E:\porozheha\list prozheha\namayandeelmi-javad"
if not exist "%TARGET%\server.js" set "TARGET=E:\prozheha\list prozheha\namayandeelmi-javad"
echo مسیر پیشنهادی: %TARGET%
set /p TARGET=مسیر فولدر برنامه روی ویندوز (یا Enter): 

if not exist "%TARGET%" (
  echo مسیر وجود ندارد.
  pause
  exit /b 1
)

echo.
echo مبدأ: %CD%
echo مقصد: %TARGET%
echo.
set "OK=N"
set /p OK=ادامه؟ (Y/N): 
if /I not "%OK%"=="Y" (
  echo لغو شد.
  pause
  exit /b 0
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\clean-extra-files.ps1" -Root "%TARGET%" -SyncFrom "%CD%" -Apply
echo.
echo تمام. Ctrl+F5 در مرورگر بزن. اگر گیت داری PUSH_GITHUB_CLEAN.bat را هم اجرا کن.
pause
