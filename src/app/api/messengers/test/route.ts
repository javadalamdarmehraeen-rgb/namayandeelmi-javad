import { db } from "@/db";
import { messageLogs, messengers } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { sendOne } from "@/lib/messaging";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
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
