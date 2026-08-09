import { db } from "@/db";
import { settings } from "@/db/schema";
import { DEFAULT_PRODUCTS, type ProductConfig } from "./defaults";
import { eq } from "drizzle-orm";

/** لیست کالاهای فعال بر اساس تنظیمات مدیر (با ترتیب دلخواه او) */
export async function getProducts(): Promise<ProductConfig[]> {
  try {
    const rows = await db.select().from(settings).where(eq(settings.key, "products")).limit(1);
    const v = rows[0]?.value as ProductConfig[] | undefined;
    if (Array.isArray(v) && v.length) return v.filter((p) => p.enabled !== false);
  } catch {
    /* ignore */
  }
  return DEFAULT_PRODUCTS;
}
