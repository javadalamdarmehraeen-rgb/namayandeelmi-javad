@echo off
setlocal EnableExtensions
chcp 65001 >nul
title پاکسازی فایل‌های اضافی برنامه نمایندگان علمی
cd /d "%~dp0"

echo.
echo ============================================
echo   پاکسازی فایل‌هایی که در نسخه فعلی نیستند
echo ============================================
echo.
echo این برنامه فایل‌های قدیمی/اضافی را از فولدر پروژه حذف می‌کند.
echo فولدر گیت، رمزها (.env)، node_modules و پشتیبان‌ها دست نمی‌خورند.
echo.
echo مسیر پیش‌فرض همین فولدر است:
echo %CD%
echo.
set "TARGET=%CD%"
set /p TARGET=اگر مسیر دیگری است اینجا بگذار (یا Enter بزن): 

if not exist "%TARGET%\server.js" (
  echo.
  echo خطا: در این مسیر server.js پیدا نشد.
  echo باید داخل فولدر اصلی برنامه اجرا شود.
  pause
  exit /b 1
)

echo.
echo --- پیش‌نمایش فایل‌های اضافی ---
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\clean-extra-files.ps1" -Root "%TARGET%"
if errorlevel 1 (
  echo پاکسازی اجرا نشد.
  pause
  exit /b 1
)

echo.
set "OK=N"
set /p OK=همین فایل‌ها حذف شوند؟ (Y/N): 
if /I not "%OK%"=="Y" (
  echo لغو شد. چیزی حذف نشد.
  pause
  exit /b 0
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\clean-extra-files.ps1" -Root "%TARGET%" -Apply
echo.
echo تمام. حالا فایل‌های نسخه جدید را روی همین فولدر کپی کن.
echo اگر این فولدر به گیت‌هاب وصل است، بعد PUSH_GITHUB_CLEAN.bat را اجرا کن.
echo.
pause
