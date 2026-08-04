import { db } from "@/db";
import { settings } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { ensureSeed } from "@/lib/bootstrap";
import { DEFAULT_COLUMNS, DEFAULT_PRODUCTS } from "@/lib/defaults";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const FALLBACK: Record<string, unknown> = {
  products: DEFAULT_PRODUCTS,
  "columns.pharmacies": DEFAULT_COLUMNS.pharmacies,
  "columns.doctors": DEFAULT_COLUMNS.doctors,
  "columns.orders": DEFAULT_COLUMNS.orders,
};

export async function GET(req: Request) {
  await ensureSeed();
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const key = new URL(req.url).searchParams.get("key");
  const rows = await db.select().from(settings);
  const map: Record<string, unknown> = { ...FALLBACK };
  for (const r of rows) map[r.key] = r.value;
  if (key) return Response.json({ key, value: map[key] ?? null });
  return Response.json({ values: map });
}

export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && !user.permissions.includes("columns"))) {
    return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }
  const b = await req.json().catch(() => ({}));
  const key = String(b.key ?? "");
  if (!key || b.value === undefined) return Response.json({ error: "ورودی نامعتبر" }, { status: 400 });
  const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  if (existing.length) {
    await db.update(settings).set({ value: b.value, updatedAt: new Date() }).where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ key, value: b.value });
  }
  return Response.json({ ok: true });
}
