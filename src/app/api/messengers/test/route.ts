import { db } from "@/db";
import { messageLogs, messengers } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { getProxy, sendOne } from "@/lib/messaging";
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
    if (!proxy.url) return Response.json({ ok: false, detail: "آدرس پروکسی وارد نشده است" });
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12000);
      const res = await fetch(proxy.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(proxy.secret ? { "x-proxy-secret": proxy.secret } : {}),
        },
        body: JSON.stringify({ ping: true }),
        signal: ctrl.signal,
        cache: "no-store",
      });
      clearTimeout(timer);
      const raw = (await res.text()).slice(0, 200);
      // هر پاسخی (حتی خطای اعتبارسنجی) یعنی ورکر در دسترس است
      return Response.json({ ok: true, detail: `ورکر پاسخ داد (کد ${res.status}): ${raw}` });
    } catch (err) {
      return Response.json({
        ok: false,
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
