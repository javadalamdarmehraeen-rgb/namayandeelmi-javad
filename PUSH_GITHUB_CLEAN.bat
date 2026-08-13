@echo off
setlocal EnableExtensions
chcp 65001 >nul
title حذف فایل اضافی از گیت و آماده‌سازی پوش به گیت‌هاب
cd /d "%~dp0"

echo.
echo ============================================
echo   حذف فایل‌های اضافی از گیت / گیت‌هاب
echo ============================================
echo.
echo از این محیط Arena نمی‌شود مستقیم روی گیت‌هاب پوش کرد.
echo این فایل روی سیستم خودت:
echo   1) فایل‌های اضافی را از دیسک پاک می‌کند
echo   2) حذف‌ها را در گیت ثبت می‌کند
echo   3) اگر بگویی، به origin پوش می‌کند
echo.

if not exist "%CD%\.git" (
  echo این فولدر مخزن گیت نیست (پوشه .git ندارد).
  echo اول CLEAN_EXTRA_FILES.bat را اینجا اجرا کن.
  echo برای گیت‌هاب باید در همان فولدری باشی که git clone کرده‌ای.
  pause
  exit /b 1
)

where git >nul 2>&1
if errorlevel 1 (
  echo git روی این سیستم پیدا نشد.
  pause
  exit /b 1
)

echo --- پاکسازی دیسک ---
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\clean-extra-files.ps1" -Root "%CD%" -Apply

echo.
echo --- ثبت حذف‌ها در گیت ---
git rm -f --ignore-unmatch -- "__rzi_4828.46476.rartemp" "CHANGELOG_ENHANCEMENTS.md" "public/crm-enhancements.js" "public/data/iran-provinces.geojson" "public/icon.svg" "public/logo.svg" "public/src-svg/brand-1280x720.svg" "public/src-svg/desktop-1280x720.svg" "public/src-svg/mobile-720x1280.svg" "src/app/api/messengers/test/route.ts"
if exist "public\src-svg" git rm -r -f --ignore-unmatch -- "public/src-svg" 2>nul

git add -A
echo.
echo --- وضعیت ---
git status -sb
echo.
set "OK=N"
set /p OK=همین تغییرات commit شود؟ (Y/N): 
if /I not "%OK%"=="Y" (
  echo commit نشد.
  pause
  exit /b 0
)

git commit -m "chore: remove leftover extra files not in current version"
if errorlevel 1 (
  echo چیزی برای commit نبود یا commit خطا داد.
  pause
  exit /b 1
)

echo.
set "PUSH=N"
set /p PUSH=الان به GitHub پوش شود؟ (Y/N): 
if /I not "%PUSH%"=="Y" (
  echo پوش نشد. هر وقت خواستی:
  echo   git push origin main
  pause
  exit /b 0
)

git push origin main
if errorlevel 1 (
  echo پوش خطا داد. دستی اجرا کن: git push origin main
  pause
  exit /b 1
)

echo.
echo پوش انجام شد. فایل‌های اضافی از گیت‌هاب هم باید حذف شده باشند.
pause
