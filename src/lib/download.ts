"use client";

/**
 * دانلود امن فایل از API.
 *
 * چرا لازم است؟ لینک ساده <a href> هدر `x-auth-token` را حمل نمی‌کند و اگر
 * کوکی هم در دسترس نباشد، سرور «دسترسی غیرمجاز» می‌دهد. این تابع فایل را با
 * fetch (که توکن را ضمیمه می‌کند) می‌گیرد و سپس دانلود را آغاز می‌کند.
 */
export async function downloadFile(path: string, fallbackName = "export.xls"): Promise<string> {
  try {
    const res = await fetch(path, { cache: "no-store", credentials: "include" });
    if (!res.ok) {
      const msg = await res
        .json()
        .then((d) => d?.error)
        .catch(() => null);
      return `✖ ${msg ?? `خطای ${res.status} در دریافت فایل`}`;
    }

    // نام فایل از هدر Content-Disposition
    let name = fallbackName;
    const cd = res.headers.get("content-disposition") ?? "";
    const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd);
    if (m) name = decodeURIComponent(m[1]);

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return "✅ فایل دانلود شد";
  } catch (err) {
    return `✖ ${err instanceof Error ? err.message : "دانلود ناموفق بود"}`;
  }
}
