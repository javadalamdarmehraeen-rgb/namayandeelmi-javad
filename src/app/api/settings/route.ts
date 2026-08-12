import { db } from "@/db";
import { settings } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { ensureSeed } from "@/lib/bootstrap";
import { DEFAULT_COLUMNS, DEFAULT_FORM_FIELDS, DEFAULT_PRODUCTS } from "@/lib/defaults";
import { eq } from "drizzle-orm";
export const dynamic = "force-dynamic";
const FALLBACK: Record<string, unknown> = {
  products: DEFAULT_PRODUCTS,
  "columns.pharmacies": DEFAULT_COLUMNS.pharmacies,
  "columns.doctors": DEFAULT_COLUMNS.doctors,
  "columns.orders": DEFAULT_COLUMNS.orders,
  "fields.pharmacies": DEFAULT_FORM_FIELDS.pharmacies,
  "fields.doctors": DEFAULT_FORM_FIELDS.doctors,
  "fields.orders": DEFAULT_FORM_FIELDS.orders,
};
export async function GET(req: Request) {
  await ensureSeed();
  const user = await getSessionUser();
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const key = new URL(req.url).searchParams.get("key");
  const rows = await db.select().from(settings);
  const map: Record<string, unknown> = { ...FALLBACK };
  for (const r of rows) map[r.key] = r.value;
  if (user.role !== "admin") delete map["sms"];
  if (key) return Response.json({ key, value: map[key] ?? null });
  return Response.json({ values: map });
}
export async function PUT(req: Request) {
  const user = await getSessionUser();
  const b0 = user ? null : null;
  void b0;
  if (!user) return Response.json({ error: " " }, { status: 401 });
  const allowed =
    user.role === "admin" ||
    user.permissions.includes("columns") ||
    user.permissions.includes("messengers") ||
    user.permissions.includes("users");
  if (!allowed) return Response.json({ error: " " }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const key = String(b.key ?? "");
  if (!key || b.value === undefined) return Response.json({ error: " " }, { status: 400 });
  const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  if (existing.length) {
    await db.update(settings).set({ value: b.value, updatedAt: new Date() }).where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ key, value: b.value });
  }
  return Response.json({ ok: true });
}
