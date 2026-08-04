import { db } from "@/db";
import { messageLogs, messengers } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { getProxy, getTokens, sendOne } from "@/lib/messaging";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && !user.permissions.includes("messengers"))) {
    return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }
  const b = await req.json().catch(() => ({}));

  if (b.pingProxy) {
    const proxy = await getProxy();
    if (!proxy.url) return Response.json({ ok: false, version: "down", detail: "آدرس پروکسی وارد نشده است" });
    const tokens = await getTokens();
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      // درخواست کشف چت با توکن؛ فقط ورکر نسخه جدید توکن بدنه را می‌پذیرد
      const res = await fetch(proxy.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(proxy.secret ? { "x-proxy-secret": proxy.secret } : {}),
        },
        body: JSON.stringify({ action: "getUpdates", messenger: "bale", token: tokens.bale ?? "" }),
        signal: ctrl.signal,
        cache: "no-store",
      });
      clearTimeout(timer);
      const raw = (await res.text()).slice(0, 250);
      const supportsToken = /"result"|"ok"\s*:\s*true/.test(raw);
      if (supportsToken) {
        return Response.json({
          ok: true,
          version: "new",
          detail: "✅ ورکر نسخه جدید فعال است و توکن را از برنامه می‌پذیرد.",
        });
      }
      return Response.json({
        ok: true,
        version: "old",
        detail:
          "⚠️ ورکر در دسترس است اما نسخه قدیمی است و توکن ارسالی از برنامه را نادیده می‌گیرد. کد جدید ورکر را جایگزین کنید (یا توکن بله را داخل خود ورکر قرار دهید). پاسخ ورکر: " +
          raw,
      });
    } catch (err) {
      return Response.json({
        ok: false,
        version: "down",
        detail: err instanceof Error ? err.message : "اتصال به پروکسی برقرار نشد",
      });
    }
  }

  const id = Number(b.id);
  const rows = await db.select().from(messengers).where(eq(messengers.id, id)).limit(1);
  const m = rows[0];
  if (!m) return Response.json({ error: "مقصد یافت نشد" }, { status: 404 });

  const r = await sendOne(
    { platform: m.platform, target: m.target, token: m.token },
    "🔔 پیام آزمایشی از سامانه «ثبت اطلاعات کل».\nاگر این پیام را دریافت کردید، تنظیمات صحیح است.",
  );
  await db
    .insert(messageLogs)
    .values({ platform: m.platform, target: m.target, ok: r.ok, detail: `تست: ${r.detail}` })
    .catch(() => undefined);
  return Response.json({ ok: r.ok, detail: r.detail });
}
