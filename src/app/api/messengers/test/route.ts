import { db } from "@/db";
import { messageLogs, messengers } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { dispatchText, getProxy, getTokens, sendOne, PLATFORM_LABEL } from "@/lib/messaging";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const TEST_TEXT =
  "🔔 پیام آزمایشی از سامانه «ثبت اطلاعات کل»\n" +
  "اگر این پیام را دریافت کردید، تنظیمات این مقصد صحیح است و سفارش‌ها به‌صورت خودکار ارسال خواهند شد.";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && !user.permissions.includes("messengers"))) {
    return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }
  const b = await req.json().catch(() => ({}));

  /* ---- بررسی در دسترس بودن پروکسی و نسخه ورکر ---- */
  if (b.pingProxy) {
    const proxy = await getProxy();
    if (!proxy.url) return Response.json({ ok: false, version: "down", detail: "آدرس پروکسی وارد نشده است" });
    const tokens = await getTokens();
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(proxy.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(proxy.secret ? { "x-proxy-secret": proxy.secret } : {}) },
        body: JSON.stringify({ action: "getUpdates", messenger: "bale", token: tokens.bale ?? "" }),
        signal: ctrl.signal,
        cache: "no-store",
      });
      clearTimeout(timer);
      const raw = (await res.text()).slice(0, 250);
      const supportsToken = /"result"|"ok"\s*:\s*true/.test(raw);
      return Response.json({
        ok: true,
        version: supportsToken ? "new" : "old",
        detail: supportsToken
          ? "✅ ورکر نسخه جدید فعال است و توکن را از برنامه می‌پذیرد."
          : `⚠️ ورکر در دسترس است اما نسخه قدیمی است. پاسخ: ${raw}`,
      });
    } catch (err) {
      return Response.json({
        ok: false,
        version: "down",
        detail: err instanceof Error ? err.message : "اتصال به پروکسی برقرار نشد",
      });
    }
  }

  /* ---- تست همه مقصدهای فعال ---- */
  if (b.all) {
    const report = await dispatchText(TEST_TEXT);
    return Response.json(report);
  }

  /* ---- تست یک مقصد ---- */
  const id = Number(b.id);
  if (!Number.isFinite(id)) return Response.json({ error: "شناسه نامعتبر" }, { status: 400 });

  const rows = await db.select().from(messengers).where(eq(messengers.id, id)).limit(1);
  const m = rows[0];
  if (!m) return Response.json({ error: "مقصد یافت نشد" }, { status: 404 });

  const r = await sendOne(
    {
      id: m.id,
      platform: m.platform,
      target: m.target,
      token: m.token,
      provider: m.provider,
      apiUrl: m.apiUrl,
      label: m.label,
    },
    TEST_TEXT,
  );

  await db
    .insert(messageLogs)
    .values({ platform: m.platform, target: m.target, ok: r.ok, detail: `تست: ${r.detail}` })
    .catch(() => undefined);
  await db
    .update(messengers)
    .set({
      lastStatus: `${r.ok ? "✔" : "✖"} تست: ${r.detail}`.slice(0, 400),
      ...(r.ok ? { lastOkAt: new Date() } : { lastErrorAt: new Date() }),
    })
    .where(eq(messengers.id, id))
    .catch(() => undefined);

  return Response.json({ ok: r.ok, detail: r.detail, via: r.via, platform: PLATFORM_LABEL[m.platform] });
}
