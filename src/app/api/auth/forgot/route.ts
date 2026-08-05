import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureSeed } from "@/lib/bootstrap";
import { notify } from "@/lib/notify";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** درخواست بازیابی رمز — برای مدیر اعلان ارسال می‌شود */
export async function POST(req: Request) {
  await ensureSeed();
  const b = await req.json().catch(() => ({}));
  const username = String(b.username ?? "").trim().toLowerCase();
  const phone = String(b.phone ?? "").replace(/\D/g, "");
  if (!username) return Response.json({ error: "نام کاربری را وارد کنید" }, { status: 400 });

  const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
  const u = rows[0];
  // پیام یکسان برای جلوگیری از افشای وجود کاربر
  const done = Response.json({
    ok: true,
    message:
      "✅ درخواست بازیابی رمز ثبت شد. مدیر سیستم اعلان دریافت کرد و رمز جدید را برای شما ارسال می‌کند. در صورت عجله با مدیر تماس بگیرید.",
  });
  if (!u) return done;

  for (const role of ["admin", "supervisor"] as const) {
    await notify({
      toRole: role,
      fromName: u.fullName,
      kind: "password",
      title: `🔑 درخواست بازیابی رمز عبور — ${u.fullName}`,
      body: `نام کاربری: ${u.username}\nشماره اعلام‌شده: ${phone || "—"}\nشماره ثبت‌شده: ${u.phone || "—"}\nاز صفحه «کاربران و دسترسی» رمز جدید تعیین کنید.`,
      link: "/admin/users",
    });
  }
  return done;
}
