import {
  pgTable,
  serial,
  text,
  varchar,
  boolean,
  timestamp,
  integer,
  doublePrecision,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 80 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: varchar("full_name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull().default(""),
  role: varchar("role", { length: 20 }).notNull().default("rep"), // admin | rep
  active: boolean("active").notNull().default(true),
  permissions: jsonb("permissions")
    .$type<string[]>()
    .notNull()
    .default(["pharmacy", "doctor", "order", "trip"]),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pharmacies = pgTable("pharmacies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  repName: varchar("rep_name", { length: 160 }).notNull(),
  dateShamsi: varchar("date_shamsi", { length: 12 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  managerName: varchar("manager_name", { length: 160 }).notNull().default(""),
  managerPhone: varchar("manager_phone", { length: 20 }).notNull().default(""),
  address: text("address").notNull().default(""),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  locationLabel: varchar("location_label", { length: 200 }).notNull().default(""),
  sent: boolean("sent").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  repName: varchar("rep_name", { length: 160 }).notNull(),
  dateShamsi: varchar("date_shamsi", { length: 12 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  specialty: varchar("specialty", { length: 160 }).notNull().default(""),
  phone: varchar("phone", { length: 20 }).notNull().default(""),
  secretaryName: varchar("secretary_name", { length: 160 }).notNull().default(""),
  secretaryPhone: varchar("secretary_phone", { length: 20 }).notNull().default(""),
  address: text("address").notNull().default(""),
  otherAddresses: text("other_addresses").notNull().default(""),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  locationLabel: varchar("location_label", { length: 200 }).notNull().default(""),
  sent: boolean("sent").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  repName: varchar("rep_name", { length: 160 }).notNull(),
  dateShamsi: varchar("date_shamsi", { length: 12 }).notNull(),
  pharmacyName: varchar("pharmacy_name", { length: 200 }).notNull(),
  managerName: varchar("manager_name", { length: 160 }).notNull().default(""),
  managerPhone: varchar("manager_phone", { length: 20 }).notNull().default(""),
  address: text("address").notNull().default(""),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  locationLabel: varchar("location_label", { length: 200 }).notNull().default(""),
  items: jsonb("items").$type<Record<string, number>>().notNull().default({}),
  distributor: varchar("distributor", { length: 160 }).notNull().default(""),
  visitor: varchar("visitor", { length: 160 }).notNull().default(""),
  notes: text("notes").notNull().default(""),
  sendStatus: text("send_status").notNull().default(""),
  sent: boolean("sent").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// dropdown option lists managed live by admin: specialty | distributor | visitor
export const options = pgTable("options", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 40 }).notNull(),
  value: varchar("value", { length: 200 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  repName: varchar("rep_name", { length: 160 }).notNull(),
  dateShamsi: varchar("date_shamsi", { length: 12 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active | ended
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
});

export const tripPoints = pgTable("trip_points", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  accuracy: doublePrecision("accuracy"),
  kind: varchar("kind", { length: 20 }).notNull().default("move"), // start | move | pause | end
  note: varchar("note", { length: 200 }).notNull().default(""),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  synced: boolean("synced").notNull().default(true),
});

export const messengers = pgTable("messengers", {
  id: serial("id").primaryKey(),
  platform: varchar("platform", { length: 20 }).notNull(), // bale | eitaa | whatsapp
  label: varchar("label", { length: 160 }).notNull().default(""),
  targetType: varchar("target_type", { length: 20 }).notNull().default("phone"), // phone | group
  target: varchar("target", { length: 200 }).notNull().default(""),
  token: text("token").notNull().default(""),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messageLogs = pgTable("message_logs", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id"),
  platform: varchar("platform", { length: 20 }).notNull(),
  target: varchar("target", { length: 200 }).notNull().default(""),
  ok: boolean("ok").notNull().default(false),
  detail: text("detail").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  userName: varchar("user_name", { length: 160 }).notNull().default(""),
  action: varchar("action", { length: 80 }).notNull(),
  detail: text("detail").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
