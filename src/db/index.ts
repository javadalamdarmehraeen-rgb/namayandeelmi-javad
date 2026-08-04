import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

export const hasDatabaseUrl = Boolean(databaseUrl);

if (!databaseUrl) {
  // در محیط‌هایی مثل Render اگر متغیر تنظیم نشده باشد، به جای کرش کردن کل برنامه
  // پیام واضح لاگ می‌شود و کاربر در صفحه ورود خطای فارسی می‌بیند.
  console.error(
    "❌ DATABASE_URL تنظیم نشده است. در Render → Environment مقدار رشته اتصال Neon را اضافه کنید.",
  );
}

const effectiveUrl = databaseUrl ?? "postgresql://invalid:invalid@127.0.0.1:1/invalid";
const isLocal = /localhost|127\.0\.0\.1/.test(effectiveUrl);

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: effectiveUrl,
    // Neon / Render managed Postgres require TLS; local docker does not.
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
