#!/usr/bin/env sh
# ============================================================
#  SYNC ALL — همگام‌سازی یک‌دستوری با گیت‌هاب و گیت‌لب
#  روش استفاده:
#     sh sync_all.sh توضیح تغییرات
#  اگر توضیح ندهی، تاریخ/ساعت به‌عنوان پیام ثبت می‌شود.
#  معادل ویندوزی این فایل: SYNC_ALL.bat
# ============================================================

cd "$(dirname "$0")" || exit 1

if [ ! -d .git ]; then
  echo "[خطا] پوشه .git اینجا نیست؛ این فایل باید داخل فولدر برنامه باشد."
  exit 1
fi

MSG="$*"
if [ -z "$MSG" ]; then MSG="update $(date '+%Y-%m-%d %H:%M')"; fi

echo ""
echo "--- 1) گرفتن آخرین تغییرات از گیت‌هاب «pull» ---"
if ! git pull --no-rebase origin main; then
  echo "[توقف] pull از گیت‌هاب خطا داد؛ تعارض را دستی حل کن و دوباره اجرا کن."
  exit 1
fi

if git remote get-url gitlab >/dev/null 2>&1; then
  echo ""
  echo "--- 1b) گرفتن آخرین تغییرات از گیت‌لب ---"
  if ! git pull --no-rebase gitlab main; then
    echo "[توقف] pull از گیت‌لب خطا داد؛ تعارض را دستی حل کن و دوباره اجرا کن."
    exit 1
  fi
else
  echo "[i] ریموت gitlab هنوز تنظیم نشده؛ فقط گیت‌هاب همگام می‌شود."
  echo "    راهنمای یک‌بار تنظیم گیت‌لب: RAHNAMA_GITLAB.txt"
fi

echo ""
echo "--- 2) ثبت تغییرات محلی ---"
git add -A
git commit -m "$MSG" || echo "[i] تغییر جدیدی برای ثبت نبود؛ ادامه می‌دهیم..."

echo ""
echo "--- 3) ارسال به گیت‌هاب ---"
if ! git push origin main; then
  echo "[خطا] push به گیت‌هاب رد شد؛ دوباره sync_all را اجرا کن تا اول pull شود."
  exit 1
fi

if git remote get-url gitlab >/dev/null 2>&1; then
  echo ""
  echo "--- 4) ارسال به گیت‌لب ---"
  git push gitlab main || echo "[هشدار] push به گیت‌لب رد شد؛ بعداً دستی بزن: git push gitlab main"
else
  echo "[i] push به گیت‌لب انجام نشد «ریموت gitlab تنظیم نشده است»."
fi

echo ""
echo "--- تمام شد؛ گیت‌هاب و گیت‌لب همگام هستند ---"
git status -sb
