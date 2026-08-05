export const dynamic = "force-dynamic";

/** پاسخ فوق‌سبک بدون تماس با دیتابیس — برای بیدار کردن سرور روی اینترنت موبایل */
export async function GET() {
  return new Response(JSON.stringify({ ok: true, t: Date.now() }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function HEAD() {
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
