import { db, hasDatabaseUrl } from "@/db";
import { ensureSeed } from "@/lib/bootstrap";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasDatabaseUrl) {
    return Response.json(
      { ok: false, db: false, reason: "DATABASE_URL تنظیم نشده است" },
      { status: 500 },
    );
  }
  try {
    // مهلت کوتاه تا healthcheck روی دیتابیس کند/سرد گیر نکند
    await Promise.race([
      db.execute(sql`select 1`),
      new Promise((_, rej) => setTimeout(() => rej(new Error("db timeout")), 8000)),
    ]);
    await ensureSeed();
    return Response.json({ ok: true, db: true });
  } catch (err) {
    return Response.json(
      { ok: false, db: false, reason: err instanceof Error ? err.message : "خطای ناشناخته" },
      { status: 500 },
    );
  }
}
