import { db } from "@/db";
import { options, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth";
import { DEFAULT_SPECIALTIES } from "./constants";

let done = false;

/** Idempotently create the default admin user + starter dropdown values. */
export async function ensureSeed() {
  if (done) return;
  try {
    const admin = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
    if (admin.length === 0) {
      await db.insert(users).values({
        username: "admin",
        passwordHash: hashPassword("admin1234"),
        fullName: "مدیر سیستم",
        phone: "09120000000",
        role: "admin",
        permissions: ["pharmacy", "doctor", "order", "trip", "admin"],
      });
      await db.insert(users).values({
        username: "rep1",
        passwordHash: hashPassword("rep1234"),
        fullName: "نماینده علمی نمونه",
        phone: "09121111111",
        role: "rep",
        permissions: ["pharmacy", "doctor", "order", "trip"],
      });
    }
    const existing = await db.select().from(options).limit(1);
    if (existing.length === 0) {
      await db.insert(options).values([
        ...DEFAULT_SPECIALTIES.map((v) => ({ category: "specialty", value: v })),
        { category: "distributor", value: "پخش سراسری" },
        { category: "distributor", value: "پخش هجرت" },
        { category: "visitor", value: "ویزیتور ۱" },
      ]);
    }
    done = true;
  } catch {
    // table may not exist yet during first build; ignore
  }
}
