import { db } from "@/db";
import { options, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { hashPassword } from "./auth";
import { DEFAULT_SPECIALTIES } from "./constants";

let done = false;
let running: Promise<void> | null = null;

/**
 * Creates every table if it does not exist (so deploying to Neon / Render works
 * without running drizzle-kit manually) and seeds the default admin account.
 */
async function migrate() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id serial PRIMARY KEY,
      username varchar(80) NOT NULL UNIQUE,
      password_hash text NOT NULL,
      full_name varchar(160) NOT NULL,
      phone varchar(20) NOT NULL DEFAULT '',
      role varchar(20) NOT NULL DEFAULT 'rep',
      active boolean NOT NULL DEFAULT true,
      permissions jsonb NOT NULL DEFAULT '["pharmacy","doctor","order","trip"]'::jsonb,
      last_seen_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS pharmacies (
      id serial PRIMARY KEY,
      user_id integer NOT NULL,
      rep_name varchar(160) NOT NULL,
      date_shamsi varchar(12) NOT NULL,
      name varchar(200) NOT NULL,
      manager_name varchar(160) NOT NULL DEFAULT '',
      manager_phone varchar(20) NOT NULL DEFAULT '',
      address text NOT NULL DEFAULT '',
      lat double precision,
      lng double precision,
      location_label varchar(200) NOT NULL DEFAULT '',
      sent boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS doctors (
      id serial PRIMARY KEY,
      user_id integer NOT NULL,
      rep_name varchar(160) NOT NULL,
      date_shamsi varchar(12) NOT NULL,
      name varchar(200) NOT NULL,
      specialty varchar(160) NOT NULL DEFAULT '',
      phone varchar(20) NOT NULL DEFAULT '',
      secretary_name varchar(160) NOT NULL DEFAULT '',
      secretary_phone varchar(20) NOT NULL DEFAULT '',
      address text NOT NULL DEFAULT '',
      other_addresses text NOT NULL DEFAULT '',
      lat double precision,
      lng double precision,
      location_label varchar(200) NOT NULL DEFAULT '',
      sent boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS orders (
      id serial PRIMARY KEY,
      user_id integer NOT NULL,
      rep_name varchar(160) NOT NULL,
      date_shamsi varchar(12) NOT NULL,
      pharmacy_name varchar(200) NOT NULL,
      manager_name varchar(160) NOT NULL DEFAULT '',
      manager_phone varchar(20) NOT NULL DEFAULT '',
      address text NOT NULL DEFAULT '',
      lat double precision,
      lng double precision,
      location_label varchar(200) NOT NULL DEFAULT '',
      items jsonb NOT NULL DEFAULT '{}'::jsonb,
      distributor varchar(160) NOT NULL DEFAULT '',
      visitor varchar(160) NOT NULL DEFAULT '',
      notes text NOT NULL DEFAULT '',
      send_status text NOT NULL DEFAULT '',
      sent boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS options (
      id serial PRIMARY KEY,
      category varchar(40) NOT NULL,
      value varchar(200) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS trips (
      id serial PRIMARY KEY,
      user_id integer NOT NULL,
      rep_name varchar(160) NOT NULL,
      date_shamsi varchar(12) NOT NULL,
      status varchar(20) NOT NULL DEFAULT 'active',
      started_at timestamptz NOT NULL DEFAULT now(),
      ended_at timestamptz
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS trip_points (
      id serial PRIMARY KEY,
      trip_id integer NOT NULL,
      lat double precision NOT NULL,
      lng double precision NOT NULL,
      accuracy double precision,
      kind varchar(20) NOT NULL DEFAULT 'move',
      note varchar(200) NOT NULL DEFAULT '',
      recorded_at timestamptz NOT NULL DEFAULT now(),
      synced boolean NOT NULL DEFAULT true
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS messengers (
      id serial PRIMARY KEY,
      platform varchar(20) NOT NULL,
      label varchar(160) NOT NULL DEFAULT '',
      target_type varchar(20) NOT NULL DEFAULT 'phone',
      target varchar(200) NOT NULL DEFAULT '',
      token text NOT NULL DEFAULT '',
      enabled boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS message_logs (
      id serial PRIMARY KEY,
      order_id integer,
      platform varchar(20) NOT NULL,
      target varchar(200) NOT NULL DEFAULT '',
      ok boolean NOT NULL DEFAULT false,
      detail text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id serial PRIMARY KEY,
      user_id integer,
      user_name varchar(160) NOT NULL DEFAULT '',
      action varchar(80) NOT NULL,
      detail text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS trip_points_trip_idx ON trip_points (trip_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS orders_user_idx ON orders (user_id);`);
}

async function seed() {
  const admin = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
  if (admin.length === 0) {
    await db.insert(users).values({
      username: "admin",
      passwordHash: hashPassword(process.env.ADMIN_PASSWORD || "admin1234"),
      fullName: "مدیر سیستم",
      phone: process.env.ADMIN_PHONE || "09120000000",
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
}

/** Idempotent: creates tables + default data. Safe to call on every request. */
export async function ensureSeed() {
  if (done) return;
  if (running) return running;
  running = (async () => {
    try {
      await migrate();
      await seed();
      done = true;
    } catch (err) {
      console.error("bootstrap error", err);
    } finally {
      running = null;
    }
  })();
  return running;
}
