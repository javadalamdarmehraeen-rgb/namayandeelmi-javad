import { db } from "@/db";
import { activityLogs, options } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { ensureSeed } from "@/lib/bootstrap";
import { OPTION_CATEGORIES } from "@/lib/constants";
import { and, asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const VALID = OPTION_CATEGORIES.map((c) => c.key);

export async function GET(req: Request) {
  await ensureSeed();
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const parent = url.searchParams.get("parent");
  let rows = category
    ? await db.select().from(options).where(eq(options.category, category)).orderBy(asc(options.value))
    : await db.select().from(options).orderBy(asc(options.category), asc(options.value));
  if (parent) rows = rows.filter((r) => r.parent === parent);
  return Response.json({ rows });
}

/** هم مدیر و هم نماینده (با دسترسی options) می‌توانند در لحظه مقدار اضافه کنند. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const canAdd = user.role === "admin" || user.permissions.includes("options");
  if (!canAdd) return Response.json({ error: "شما اجازه افزودن ندارید" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const category = String(body.category ?? "").trim();
  const value = String(body.value ?? "").trim().slice(0, 200);
  const parent = String(body.parent ?? "").trim().slice(0, 200);
  if (!VALID.includes(category) || !value) return Response.json({ error: "مقدار نامعتبر" }, { status: 400 });
  // شهر باید زیرمجموعه استان و منطقه زیرمجموعه شهر باشد
  if ((category === "city" || category === "region") && !parent) {
    return Response.json(
      { error: category === "city" ? "ابتدا استان را انتخاب کنید" : "ابتدا شهر را انتخاب کنید" },
      { status: 400 },
    );
  }

  const dupWhere =
    parent
      ? and(eq(options.category, category), eq(options.value, value), eq(options.parent, parent))
      : and(eq(options.category, category), eq(options.value, value));
  const exists = await db.select().from(options).where(dupWhere).limit(1);
  if (exists.length) return Response.json({ row: exists[0], duplicate: true });

  const [row] = await db
    .insert(options)
    .values({ category, value, parent, createdBy: user.fullName })
    .returning();
  await db
    .insert(activityLogs)
    .values({ userId: user.id, userName: user.fullName, action: "افزودن مقدار کشویی", detail: `${category}: ${value}` })
    .catch(() => undefined);
  return Response.json({ row });
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const canEdit = user.role === "admin" || user.permissions.includes("optionsDelete");
  if (!canEdit) return Response.json({ error: "شما اجازه ویرایش ندارید" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const id = Number(b.id);
  const value = String(b.value ?? "").trim().slice(0, 200);
  if (!Number.isFinite(id) || !value) return Response.json({ error: "ورودی نامعتبر" }, { status: 400 });
  await db.update(options).set({ value }).where(eq(options.id, id));
  await db
    .insert(activityLogs)
    .values({ userId: user.id, userName: user.fullName, action: "ویرایش مقدار کشویی", detail: value })
    .catch(() => undefined);
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && !user.permissions.includes("optionsDelete"))) {
    return Response.json({ error: "شما اجازه حذف ندارید" }, { status: 401 });
  }
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isFinite(id)) return Response.json({ error: "شناسه نامعتبر" }, { status: 400 });
  await db.delete(options).where(eq(options.id, id));
  return Response.json({ ok: true });
}
