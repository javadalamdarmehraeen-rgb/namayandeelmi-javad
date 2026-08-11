import { db, dbRetry } from "@/db";
import { options, roles, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { hashPassword } from "./auth";
import { DEFAULT_SPECIALTIES } from "./constants";
import { SYNC_TABLES, nodeName } from "./sync-config";
import { IRAN, PROVINCES, REGIONS } from "./iran";
import {
  ALL_PERMISSION_KEYS,
  DEFAULT_COLUMNS,
  DEFAULT_FORM_FIELDS,
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
      device_id varchar(80) NOT NULL DEFAULT '',
      device_info varchar(200) NOT NULL DEFAULT '',
      device_bound_at timestamptz,
      sim_mode varchar(12) NOT NULL DEFAULT 'device',
      permissions jsonb NOT NULL DEFAULT '["dashboard","pharmacy","doctor","order","trip","home","leave","options","repo
rts"]'::jsonb,
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
      parent varchar(200) NOT NULL DEFAULT '',
      created_by varchar(160) NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS homes (
      id serial PRIMARY KEY,

      user_id integer NOT NULL,
      rep_name varchar(160) NOT NULL,
      title varchar(160) NOT NULL DEFAULT '',
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
      kind varchar(30) NOT NULL DEFAULT '',
      from_date varchar(12) NOT NULL,
      to_date varchar(12) NOT NULL,
      days integer NOT NULL DEFAULT 1,
      from_time varchar(5) NOT NULL DEFAULT '',
      to_time varchar(5) NOT NULL DEFAULT '',
      hours double precision NOT NULL DEFAULT 0,
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
    CREATE TABLE IF NOT EXISTS live_locations (
      user_id integer PRIMARY KEY,
      rep_name varchar(160) NOT NULL DEFAULT '',
      lat double precision NOT NULL,
      lng double precision NOT NULL,
      accuracy double precision,
      speed double precision,
      heading double precision,
      battery integer,
      gps_on boolean NOT NULL DEFAULT true,
      online boolean NOT NULL DEFAULT true,
      trip_id integer,
      recorded_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
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
      target text NOT NULL DEFAULT '',
      token text NOT NULL DEFAULT '',
      provider varchar(30) NOT NULL DEFAULT '',
      api_url text NOT NULL DEFAULT '',
      enabled boolean NOT NULL DEFAULT true,
      last_status text NOT NULL DEFAULT '',

      last_ok_at timestamptz,
      last_error_at timestamptz,
      sort_order integer NOT NULL DEFAULT 0,
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
    CREATE TABLE IF NOT EXISTS attachments (
      id serial PRIMARY KEY,
      owner_type varchar(30) NOT NULL DEFAULT 'doctor',
      owner_id integer,
      user_id integer NOT NULL,
      rep_name varchar(160) NOT NULL DEFAULT '',
      file_name varchar(200) NOT NULL DEFAULT 'file',
      mime_type varchar(100) NOT NULL DEFAULT 'application/octet-stream',
      size integer NOT NULL DEFAULT 0,
      data text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS targets (
      id serial PRIMARY KEY,
      user_id integer NOT NULL,
      rep_name varchar(160) NOT NULL DEFAULT '',
      period varchar(7) NOT NULL DEFAULT '',
      product_key varchar(60) NOT NULL,
      product_label varchar(160) NOT NULL DEFAULT '',
      quantity integer NOT NULL DEFAULT 0,
      price_distributor double precision NOT NULL DEFAULT 0,
      price_pharmacy double precision NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS targets_unique_idx ON targets (user_id, period, product_key);
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS mobile_nonces (
      id serial PRIMARY KEY,
      nonce varchar(64) NOT NULL UNIQUE,
      device_id varchar(80) NOT NULL DEFAULT '',
      used boolean NOT NULL DEFAULT false,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`

    CREATE TABLE IF NOT EXISTS otp_codes (
      id serial PRIMARY KEY,
      user_id integer NOT NULL,
      phone varchar(20) NOT NULL,
      code_hash varchar(128) NOT NULL,
      device_id varchar(80) NOT NULL DEFAULT '',
      channel varchar(20) NOT NULL DEFAULT 'sms',
      attempts integer NOT NULL DEFAULT 0,
      used boolean NOT NULL DEFAULT false,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS roles (
      id serial PRIMARY KEY,
      key varchar(40) NOT NULL UNIQUE,
      label varchar(120) NOT NULL,
      base varchar(20) NOT NULL DEFAULT 'rep',
      permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
      builtin boolean NOT NULL DEFAULT false,
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
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS device_id varchar(80) NOT NULL DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS device_info varchar(200) NOT NULL DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS device_bound_at timestamptz`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS sim_mode varchar(12) NOT NULL DEFAULT 'device'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS sim_fingerprint varchar(128) NOT NULL DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS sim_carrier varchar(80) NOT NULL DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS sim_verified_at timestamptz`,
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
    `ALTER TABLE options ADD COLUMN IF NOT EXISTS parent varchar(200) NOT NULL DEFAULT ''`,
    `ALTER TABLE messengers ADD COLUMN IF NOT EXISTS provider varchar(30) NOT NULL DEFAULT ''`,
    `ALTER TABLE messengers ADD COLUMN IF NOT EXISTS api_url text NOT NULL DEFAULT ''`,
    `ALTER TABLE messengers ADD COLUMN IF NOT EXISTS last_status text NOT NULL DEFAULT ''`,
    `ALTER TABLE messengers ADD COLUMN IF NOT EXISTS last_ok_at timestamptz`,
    `ALTER TABLE messengers ADD COLUMN IF NOT EXISTS last_error_at timestamptz`,
    `ALTER TABLE messengers ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0`,
    `ALTER TABLE messengers ALTER COLUMN target TYPE text`,
    `ALTER TABLE trips ADD COLUMN IF NOT EXISTS distance_m double precision NOT NULL DEFAULT 0`,
    `ALTER TABLE trips ADD COLUMN IF NOT EXISTS stop_seconds integer NOT NULL DEFAULT 0`,
    `ALTER TABLE trip_points ADD COLUMN IF NOT EXISTS speed double precision`,
    `ALTER TABLE trip_points ADD COLUMN IF NOT EXISTS stop_seconds integer NOT NULL DEFAULT 0`,
    `ALTER TABLE trip_points ADD COLUMN IF NOT EXISTS gps_on boolean NOT NULL DEFAULT true`,
    `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS is_percent boolean NOT NULL DEFAULT false`,
    `ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS percent_value varchar(40) NOT NULL DEFAULT ''`,
    `ALTER TABLE doctors ADD COLUMN IF NOT EXISTS is_percent boolean NOT NULL DEFAULT false`,
    `ALTER TABLE doctors ADD COLUMN IF NOT EXISTS percent_value varchar(40) NOT NULL DEFAULT ''`,
    `ALTER TABLE leaves ADD COLUMN IF NOT EXISTS from_time varchar(5) NOT NULL DEFAULT ''`,
    `ALTER TABLE leaves ADD COLUMN IF NOT EXISTS to_time varchar(5) NOT NULL DEFAULT ''`,
    `ALTER TABLE leaves ADD COLUMN IF NOT EXISTS hours double precision NOT NULL DEFAULT 0`,
    `ALTER TABLE pharmacies ALTER COLUMN percent_value TYPE text`,
    `ALTER TABLE doctors ALTER COLUMN percent_value TYPE text`,
    `ALTER TABLE pharmacies ALTER COLUMN location_label TYPE text`,
    `ALTER TABLE doctors ALTER COLUMN location_label TYPE text`,
    `ALTER TABLE orders ALTER COLUMN location_label TYPE text`,
    `ALTER TABLE pharmacies ALTER COLUMN name TYPE text`,
    `ALTER TABLE doctors ALTER COLUMN name TYPE text`,
    `ALTER TABLE orders ALTER COLUMN pharmacy_name TYPE text`,
    `ALTER TABLE leaves ALTER COLUMN supervisor_note TYPE text`,
    `ALTER TABLE leaves ALTER COLUMN manager_note TYPE text`,
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
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sync_state (
      id serial PRIMARY KEY,
      peer varchar(80) NOT NULL UNIQUE,
      peer_url text NOT NULL DEFAULT '',
      enabled boolean NOT NULL DEFAULT true,
      pull_cursor timestamptz,
      push_cursor timestamptz,
      last_sync_at timestamptz,
      last_status text NOT NULL DEFAULT '',
      last_error text NOT NULL DEFAULT '',
      pulled integer NOT NULL DEFAULT 0,
      pushed integer NOT NULL DEFAULT 0,
      conflicts integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sync_logs (
      id serial PRIMARY KEY,
      peer varchar(80) NOT NULL DEFAULT '',
      direction varchar(10) NOT NULL DEFAULT 'pull',
      table_name varchar(40) NOT NULL DEFAULT '',
      applied integer NOT NULL DEFAULT 0,
      skipped integer NOT NULL DEFAULT 0,
      ok boolean NOT NULL DEFAULT true,
      detail text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await addSyncColumns();
  await db.execute(sql`CREATE INDEX IF NOT EXISTS notif_user_idx ON notifications (to_user_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS attach_owner_idx ON attachments (owner_type, owner_id)`);
}
/**
 *    (uid / updated_at / origin)    
 *      updated_at   UPDATE.
 */
async function addSyncColumns() {
  const node = nodeName();
  //    —   UPDATE    
  //         
  // (   « »        )
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION sek_touch_updated_at() RETURNS trigger AS $$
    BEGIN
      IF coalesce(current_setting('sek.sync', true), '') <> 'on' THEN
        NEW.updated_at := now();
      END IF;
      IF NEW.uid IS NULL OR NEW.uid = '' THEN
        NEW.uid := gen_random_uuid()::text;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  for (const t of SYNC_TABLES) {
    try {
      await db.execute(sql.raw(`ALTER TABLE ${t.name} ADD COLUMN IF NOT EXISTS uid varchar(40)`));
      await db.execute(
        sql.raw(`ALTER TABLE ${t.name} ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()`),
      );
      await db.execute(
        sql.raw(`ALTER TABLE ${t.name} ADD COLUMN IF NOT EXISTS origin varchar(20) NOT NULL DEFAULT '${node}'`),
      );
      //   uid  
      await db.execute(

        sql.raw(`UPDATE ${t.name} SET uid = gen_random_uuid()::text WHERE uid IS NULL OR uid = ''`),
      );
      await db.execute(
        sql.raw(`ALTER TABLE ${t.name} ALTER COLUMN uid SET DEFAULT gen_random_uuid()::text`),
      );
      await db.execute(
        sql.raw(`CREATE UNIQUE INDEX IF NOT EXISTS ${t.name}_uid_idx ON ${t.name} (uid)`),
      );
      await db.execute(
        sql.raw(`CREATE INDEX IF NOT EXISTS ${t.name}_updated_idx ON ${t.name} (updated_at)`),
      );
      await db.execute(sql.raw(`DROP TRIGGER IF EXISTS ${t.name}_touch ON ${t.name}`));
      await db.execute(
        sql.raw(
          `CREATE TRIGGER ${t.name}_touch BEFORE INSERT OR UPDATE ON ${t.name}
           FOR EACH ROW EXECUTE FUNCTION sek_touch_updated_at()`,
        ),
      );
    } catch (err) {
      console.warn(`      ${t.name} :`, err instanceof Error ? err.message : err);
    }
  }
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
        fullName: " ",
        phone: process.env.ADMIN_PHONE || "09120000000",
        role: "admin",
        permissions: ALL_PERMISSION_KEYS,
      },
      {
        username: "sarparast",
        passwordHash: hashPassword("sar1234"),
        passwordPlain: "sar1234",
        fullName: " ",
        phone: "09122222222",
        role: "supervisor",
        permissions: SUPERVISOR_DEFAULT_PERMISSIONS,
      },
      {
        username: "rep1",
        passwordHash: hashPassword("rep1234"),
        passwordPlain: "rep1234",
        fullName: "  ",
        phone: "09121111111",
        role: "rep",
        permissions: REP_DEFAULT_PERMISSIONS,
      },
    ]);
  }
  const rl = await db.select().from(roles).limit(1);
  if (rl.length === 0) {
    await db.insert(roles).values([
      { key: "admin", label: " ", base: "admin", permissions: ALL_PERMISSION_KEYS, builtin: true },
      { key: "supervisor", label: "", base: "supervisor", permissions: SUPERVISOR_DEFAULT_PERMISSIONS, builtin: tr
ue },
      { key: "rep", label: " ", base: "rep", permissions: REP_DEFAULT_PERMISSIONS, builtin: true },
      { key: "sales", label: " ", base: "rep", permissions: REP_DEFAULT_PERMISSIONS, builtin: false },
    ]);
  }
  const st = await db.select().from(settings).limit(1);
  if (st.length === 0) {
    await db.insert(settings).values([
      {
        key: "messagingProxy",
        value: {
          url: process.env.MESSAGING_PROXY_URL || "https://namayandeelmi-javad.javadalamdar-mehraeen.workers.dev/",
          enabled: true,
          secret: "",
        },
      },
      {
        key: "messengerTokens",
        value: {
          bale: process.env.BALE_BOT_TOKEN || "1199464939:uhHpJVtcy__qdtFfN7iuzr4AH7bZBKPG85A",
          telegram: process.env.TELEGRAM_BOT_TOKEN || "",

          eitaa: process.env.EITAA_TOKEN || "",
          whatsapp: process.env.WHATSAPP_TOKEN || "",
        },
      },
      { key: "products", value: DEFAULT_PRODUCTS },
      { key: "columns.pharmacies", value: DEFAULT_COLUMNS.pharmacies },
      { key: "columns.doctors", value: DEFAULT_COLUMNS.doctors },
      { key: "columns.orders", value: DEFAULT_COLUMNS.orders },
      { key: "fields.pharmacies", value: DEFAULT_FORM_FIELDS.pharmacies },
      { key: "fields.doctors", value: DEFAULT_FORM_FIELDS.doctors },
      { key: "fields.orders", value: DEFAULT_FORM_FIELDS.orders },
    ]);
  }
  //       (  )
  try {
    await db.execute(sql`
      UPDATE users SET permissions = ${JSON.stringify(ALL_PERMISSION_KEYS)}::jsonb
      WHERE role = 'admin' AND (permissions IS NULL OR jsonb_array_length(permissions) < ${ALL_PERMISSION_KEYS.length})
    `);
    await db.execute(sql`
      UPDATE users SET permissions = ${JSON.stringify(REP_DEFAULT_PERMISSIONS)}::jsonb
      WHERE role = 'rep' AND (permissions IS NULL OR jsonb_array_length(permissions) = 0)
    `);
  } catch {
    /* ignore */
  }
  // ----      (   ) ----
  const current = await db.select({ category: options.category, value: options.value, parent: options.parent }).from(opt
ions);
  const seen = new Set(current.map((r) => `${r.category}|${r.value}|${r.parent ?? ""}`));
  const wanted: { category: string; value: string; parent: string }[] = [];
  for (const v of DEFAULT_SPECIALTIES) wanted.push({ category: "specialty", value: v, parent: "" });
  for (const p of PROVINCES) {
    wanted.push({ category: "province", value: p, parent: "" });
    for (const c of IRAN[p]) {
      wanted.push({ category: "city", value: c, parent: p });
      for (const r of REGIONS[c] ?? []) wanted.push({ category: "region", value: r, parent: c });
    }
  }
  if (!seen.has("distributor| |")) wanted.push({ category: "distributor", value: " ", parent: "" });
  if (!seen.has("distributor| |")) wanted.push({ category: "distributor", value: " ", parent: "" });
  if (!seen.has("visitor| |")) wanted.push({ category: "visitor", value: " ", parent: "" });
  const missing = wanted.filter((w) => !seen.has(`${w.category}|${w.value}|${w.parent}`));
  if (missing.length > 0) {
    for (let i = 0; i < missing.length; i += 300) {
      await db.insert(options).values(missing.slice(i, i + 300));
    }
    console.log(` ${missing.length}   (///)    `);
  }
  //            
  //     (   )  .
  try {
    await db.execute(sql`DELETE FROM options WHERE category IN ('city','region') AND (parent IS NULL OR parent = '')`);
  } catch {
    /* ignore */
  }
}
export async function ensureSeed() {
  if (done) return;
  if (running) return running;
  running = (async () => {
    try {
      //        —  Neon       
      await dbRetry(() => migrate(), "bootstrap:migrate");
      await dbRetry(() => seed(), "bootstrap:seed");
      done = true;
    } catch (err) {
      console.error("bootstrap error", err);
    } finally {
      running = null;
    }
  })();
  return running;
}
