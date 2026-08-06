import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolClient, type PoolConfig } from "pg";
import { isTransientError, withRetry, type RetryOptions } from "@/lib/retry";

/* ============================================================
 *  اتصال مقاوم به PostgreSQL (Neon / Render / لوکال)
 *
 *  ۱) استفاده اجباری از endpoint نوع «pooler» روی Neon
 *  ۲) connect_timeout=15 تا دیتابیس فرصت بیدار شدن داشته باشد
 *  ۳) Retry با Exponential Backoff روی خطاهای گذرا
 * ============================================================ */

const rawUrl = process.env.DATABASE_URL;
export const hasDatabaseUrl = Boolean(rawUrl);

if (!rawUrl) {
  console.error("❌ DATABASE_URL تنظیم نشده است. در Render → Environment رشته اتصال Neon را اضافه کنید.");
}

const FALLBACK_URL = "postgresql://invalid:invalid@127.0.0.1:1/invalid";

/** آیا این آدرس یک دیتابیس محلی است؟ */
function isLocalHost(url: string) {
  return /@(localhost|127\.0\.0\.1|host\.docker\.internal)/.test(url);
}

/**
 * نرمال‌سازی رشته اتصال:
 *  - روی Neon، میزبان به نسخه `-pooler` تبدیل می‌شود (PgBouncer، پایدارتر و سریع‌تر)
 *  - `sslmode=require` برای میزبان‌های ابری
 *  - `connect_timeout=15` برای مهلت بیدار شدن دیتابیس
 *  - `application_name` برای رصد آسان در داشبورد Neon
 */
export function normalizeConnectionString(input: string): { url: string; usedPooler: boolean; local: boolean } {
  const local = isLocalHost(input);
  let usedPooler = false;

  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return { url: input, usedPooler: false, local };
  }

  if (!local) {
    // Neon: ep-xxx.region.aws.neon.tech → ep-xxx-pooler.region.aws.neon.tech
    const host = parsed.hostname;
    if (/\.neon\.tech$/i.test(host) && !host.includes("-pooler")) {
      const [first, ...rest] = host.split(".");
      parsed.hostname = [`${first}-pooler`, ...rest].join(".");
      usedPooler = true;
    } else if (host.includes("-pooler")) {
      usedPooler = true;
    }
    if (!parsed.searchParams.has("sslmode")) parsed.searchParams.set("sslmode", "require");
  }

  // مهلت اتصال ۱۵ ثانیه — فرصت کافی برای cold start
  if (!parsed.searchParams.has("connect_timeout")) parsed.searchParams.set("connect_timeout", "15");
  if (!parsed.searchParams.has("application_name")) parsed.searchParams.set("application_name", "sabt-etelaat-kol");

  return { url: parsed.toString(), usedPooler, local };
}

const { url: connectionString, usedPooler, local } = normalizeConnectionString(rawUrl ?? FALLBACK_URL);

if (rawUrl) {
  console.log(
    `🗄  اتصال دیتابیس: ${local ? "محلی" : usedPooler ? "Neon pooler ✅" : "مستقیم (بدون pooler)"} | connect_timeout=15s`,
  );
}

const poolConfig: PoolConfig = {
  connectionString,
  ssl: local ? undefined : { rejectUnauthorized: false },
  // روی PgBouncer اتصال کم و کوتاه بهتر است
  max: Number(process.env.DB_POOL_MAX ?? (local ? 5 : 8)),
  min: 0,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
  // مهلت اجرای هر کوئری تا اتصال معلق باقی نماند
  statement_timeout: 20_000,
  query_timeout: 20_000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
  allowExitOnIdle: false,
};

const globalForDb = globalThis as typeof globalThis & {
  __sekPool?: Pool;
};

function createPool() {
  const p = new Pool(poolConfig);
  // خطای اتصال بی‌کار نباید فرآیند را از پا درآورد
  p.on("error", (err) => {
    console.error("⚠️  خطای اتصال بی‌کار دیتابیس (نادیده گرفته شد):", err.message);
  });
  return p;
}

export const pool = globalForDb.__sekPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.__sekPool = pool;

export const db = drizzle(pool);

/* ------------------------------------------------------------------ */
/*  کمک‌کننده‌های مقاوم                                                 */
/* ------------------------------------------------------------------ */

const DB_RETRY: RetryOptions = {
  retries: 4,
  baseDelayMs: 1_000,
  maxDelayMs: 30_000,
  timeoutMs: 25_000,
  isRetryable: isTransientError,
};

/**
 * اجرای یک عملیات دیتابیسی با تلاش مجدد خودکار.
 *
 * @example
 * const rows = await dbRetry(() => db.select().from(users), "users:list");
 */
export function dbRetry<T>(operation: () => Promise<T>, label = "db"): Promise<T> {
  return withRetry(() => operation(), { ...DB_RETRY, label });
}

/** نسخه امن: در شکست نهایی مقدار پیش‌فرض برمی‌گردد (برای مسیرهای غیرحیاتی) */
export async function dbRetrySafe<T>(operation: () => Promise<T>, fallback: T, label = "db"): Promise<T> {
  try {
    return await dbRetry(operation, label);
  } catch (err) {
    console.error(`[db:${label}] شکست نهایی:`, err instanceof Error ? err.message : err);
    return fallback;
  }
}

/** اجرای چند دستور در یک تراکنش، با تلاش مجدد روی خطاهای گذرا */
export function dbTransaction<T>(fn: (client: PoolClient) => Promise<T>, label = "tx"): Promise<T> {
  return dbRetry(async () => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
  }, label);
}

/** بررسی سلامت اتصال؛ هرگز خطا پرتاب نمی‌کند */
export async function checkDatabase(): Promise<{ ok: boolean; latencyMs: number; detail: string }> {
  const started = Date.now();
  try {
    await withRetry(() => pool.query("select 1"), {
      retries: 2,
      baseDelayMs: 700,
      maxDelayMs: 3_000,
      timeoutMs: 12_000,
      label: "health",
    });
    return { ok: true, latencyMs: Date.now() - started, detail: usedPooler ? "pooler" : local ? "local" : "direct" };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      detail: err instanceof Error ? err.message.slice(0, 200) : "unknown",
    };
  }
}

export const dbInfo = { usedPooler, local, connectTimeoutSec: 15 };
