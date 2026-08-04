import { db } from "@/db";
import { options, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { hashPassword } from "./auth";
import { DEFAULT_PROVINCES, DEFAULT_SPECIALTIES } from "./constants";
import {
  ALL_PERMISSION_KEYS,
  DEFAULT_COLUMNS,
  DEFAULT_PRODUCTS,
  REP_DEFAULT_PERMISSIONS,
  SUPERVISOR_DEFAULT_PERMISSIONS,
} from "./defaults";
import { settings } from "@/db/schema";

let done = false;
let running: Promise<void> | null = null;

async function migrate() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id serial PRIMARY KEY,
      username varchar(80) NOT NULL UNIQUE,
      password_hash text NOT NULL,
      password_plain varchar(120) NOT NULL DEFAULT '',
      full_name varchar(160) NOT NULL,
      phone varchar(20) NOT NULL DEFAULT '',
      role varchar(20) NOT NULL DEFAULT 'rep',
      active boolean NOT NULL DEFAULT true,
      require_phone boolean NOT NULL DEFAULT true,
      permissions jsonb NOT NULL DEFAULT '["dashboard","pharmacy","doctor","order","trip","home","leave","options","reports"]'::jsonb,
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
      province varchar(100) NOT NULL DEFAULT '',
      city varchar(100) NOT NULL DEFAULT '',
      region varchar(100) NOT NULL DEFAULT '',
      name varchar(200) NOT NULL,
      landline varchar(20) NOT NULL DEFAULT '',
      manager_name varchar(160) NOT NULL DEFAULT '',
      manager_phone varchar(20) NOT NULL DEFAULT '',
      address text NOT NULL DEFAULT '',
      lat double precision,
      lng double precision,
      accuracy double precision,
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
      province varchar(100) NOT NULL DEFAULT '',
      city varchar(100) NOT NULL DEFAULT '',
      region varchar(100) NOT NULL DEFAULT '',
      name varchar(200) NOT NULL,
      specialty varchar(160) NOT NULL DEFAULT '',
      phone varchar(20) NOT NULL DEFAULT '',
      secretary_name varchar(160) NOT NULL DEFAULT '',
      secretary_phone varchar(20) NOT NULL DEFAULT '',
      address text NOT NULL DEFAULT '',
      other_addresses text NOT NULL DEFAULT '',
      lat double precision,
      lng double precision,
      accuracy double precision,
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
      accuracy double precision,
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
      created_by varchar(160) NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS homes (
      id serial PRIMARY KEY,
      user_id integer NOT NULL,
      rep_name varchar(160) NOT NULL,
      title varchar(160) NOT NULL DEFAULT 'منزل',
      address text NOT NULL DEFAULT '',
      lat double precision NOT NULL,
      lng double precision NOT NULL,
      accuracy double precision,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS leaves (
      id serial PRIMARY KEY,
      user_id integer NOT NULL,
      rep_name varchar(160) NOT NULL,
      kind varchar(30) NOT NULL DEFAULT 'روزانه',
      from_date varchar(12) NOT NULL,
      to_date varchar(12) NOT NULL,
      days integer NOT NULL DEFAULT 1,
      reason text NOT NULL DEFAULT '',
      supervisor_status varchar(20) NOT NULL DEFAULT 'pending',
      supervisor_note varchar(300) NOT NULL DEFAULT '',
      supervisor_name varchar(160) NOT NULL DEFAULT '',
      manager_status varchar(20) NOT NULL DEFAULT 'pending',
      manager_note varchar(300) NOT NULL DEFAULT '',
      manager_name varchar(160) NOT NULL DEFAULT '',
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

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id serial PRIMARY KEY,
      to_user_id integer,
      to_role varchar(20) NOT NULL DEFAULT '',
      from_name varchar(160) NOT NULL DEFAULT '',
      kind varchar(40) NOT NULL DEFAULT 'info',
      title varchar(200) NOT NULL,
      body text NOT NULL DEFAULT '',
      link varchar(200) NOT NULL DEFAULT '',
      read_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS settings (
      key varchar(80) PRIMARY KEY,
      value jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  // ---- incremental columns for databases created by older versions ----
  const alters = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_plain varchar(120) NOT NULL DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS require_phone boolean NOT NULL DEFAULT true`,
    `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS province varchar(100) NOT NULL DEFAULT ''`,
    `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS city varchar(100) NOT NULL DEFAULT ''`,
    `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS region varchar(100) NOT NULL DEFAULT ''`,
    `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS landline varchar(20) NOT NULL DEFAULT ''`,
    `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS accuracy double precision`,
    `ALTER TABLE doctors ADD COLUMN IF NOT EXISTS province varchar(100) NOT NULL DEFAULT ''`,
    `ALTER TABLE doctors ADD COLUMN IF NOT EXISTS city varchar(100) NOT NULL DEFAULT ''`,
    `ALTER TABLE doctors ADD COLUMN IF NOT EXISTS region varchar(100) NOT NULL DEFAULT ''`,
    `ALTER TABLE doctors ADD COLUMN IF NOT EXISTS accuracy double precision`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS accuracy double precision`,
    `ALTER TABLE options ADD COLUMN IF NOT EXISTS created_by varchar(160) NOT NULL DEFAULT ''`,
  ];
  for (const a of alters) {
    try {
      await db.execute(sql.raw(a));
    } catch {
      /* ignore */
    }
  }

  await db.execute(sql`CREATE INDEX IF NOT EXISTS trip_points_trip_idx ON trip_points (trip_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS orders_user_idx ON orders (user_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS pharmacies_user_idx ON pharmacies (user_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS doctors_user_idx ON doctors (user_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS activity_user_idx ON activity_logs (user_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS notif_user_idx ON notifications (to_user_id)`);
}

async function seed() {
  const admin = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
  if (admin.length === 0) {
    const adminPass = process.env.ADMIN_PASSWORD || "admin1234";
    await db.insert(users).values([
      {
        username: "admin",
        passwordHash: hashPassword(adminPass),
        passwordPlain: adminPass,
        fullName: "مدیر سیستم",
        phone: process.env.ADMIN_PHONE || "09120000000",
        role: "admin",
        permissions: ALL_PERMISSION_KEYS,
      },
      {
        username: "sarparast",
        passwordHash: hashPassword("sar1234"),
        passwordPlain: "sar1234",
        fullName: "سرپرست فروش",
        phone: "09122222222",
        role: "supervisor",
        permissions: SUPERVISOR_DEFAULT_PERMISSIONS,
      },
      {
        username: "rep1",
        passwordHash: hashPassword("rep1234"),
        passwordPlain: "rep1234",
        fullName: "نماینده علمی نمونه",
        phone: "09121111111",
        role: "rep",
        permissions: REP_DEFAULT_PERMISSIONS,
      },
    ]);
  }
  const st = await db.select().from(settings).limit(1);
  if (st.length === 0) {
    await db.insert(settings).values([
      { key: "products", value: DEFAULT_PRODUCTS },
      { key: "columns.pharmacies", value: DEFAULT_COLUMNS.pharmacies },
      { key: "columns.doctors", value: DEFAULT_COLUMNS.doctors },
      { key: "columns.orders", value: DEFAULT_COLUMNS.orders },
    ]);
  }
  const existing = await db.select().from(options).limit(1);
  if (existing.length === 0) {
    await db.insert(options).values([
      ...DEFAULT_SPECIALTIES.map((v) => ({ category: "specialty", value: v })),
      ...DEFAULT_PROVINCES.map((v) => ({ category: "province", value: v })),
      { category: "city", value: "تهران" },
      { category: "region", value: "منطقه ۱" },
      { category: "distributor", value: "پخش سراسری" },
      { category: "distributor", value: "پخش هجرت" },
      { category: "visitor", value: "ویزیتور ۱" },
    ]);
  }
}

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
