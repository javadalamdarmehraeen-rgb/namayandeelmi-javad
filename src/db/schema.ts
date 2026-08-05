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
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 80 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  passwordPlain: varchar("password_plain", { length: 120 }).notNull().default(""),
  fullName: varchar("full_name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull().default(""),
  role: varchar("role", { length: 20 }).notNull().default("rep"), // admin | supervisor | rep
  active: boolean("active").notNull().default(true),
  requirePhone: boolean("require_phone").notNull().default(true),
  deviceId: varchar("device_id", { length: 80 }).notNull().default(""),
  deviceInfo: varchar("device_info", { length: 200 }).notNull().default(""),
  deviceBoundAt: timestamp("device_bound_at", { withTimezone: true }),
  permissions: jsonb("permissions")
    .$type<string[]>()
    .notNull()
    .default(["dashboard", "pharmacy", "doctor", "order", "trip", "home", "leave", "options", "reports"]),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pharmacies = pgTable(
  "pharmacies",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    repName: varchar("rep_name", { length: 160 }).notNull(),
    dateShamsi: varchar("date_shamsi", { length: 12 }).notNull(),
    province: varchar("province", { length: 100 }).notNull().default(""),
    city: varchar("city", { length: 100 }).notNull().default(""),
    region: varchar("region", { length: 100 }).notNull().default(""),
    name: varchar("name", { length: 200 }).notNull(),
    landline: varchar("landline", { length: 20 }).notNull().default(""),
    managerName: varchar("manager_name", { length: 160 }).notNull().default(""),
    managerPhone: varchar("manager_phone", { length: 20 }).notNull().default(""),
    address: text("address").notNull().default(""),
    isPercent: boolean("is_percent").notNull().default(false),
    percentValue: text("percent_value").notNull().default(""),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    accuracy: doublePrecision("accuracy"),
    locationLabel: text("location_label").notNull().default(""),
    sent: boolean("sent").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("pharmacies_user_idx").on(t.userId)],
);

export const doctors = pgTable(
  "doctors",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    repName: varchar("rep_name", { length: 160 }).notNull(),
    dateShamsi: varchar("date_shamsi", { length: 12 }).notNull(),
    province: varchar("province", { length: 100 }).notNull().default(""),
    city: varchar("city", { length: 100 }).notNull().default(""),
    region: varchar("region", { length: 100 }).notNull().default(""),
    name: varchar("name", { length: 200 }).notNull(),
    specialty: varchar("specialty", { length: 160 }).notNull().default(""),
    phone: varchar("phone", { length: 20 }).notNull().default(""),
    secretaryName: varchar("secretary_name", { length: 160 }).notNull().default(""),
    secretaryPhone: varchar("secretary_phone", { length: 20 }).notNull().default(""),
    address: text("address").notNull().default(""),
    otherAddresses: text("other_addresses").notNull().default(""),
    isPercent: boolean("is_percent").notNull().default(false),
    percentValue: text("percent_value").notNull().default(""),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    accuracy: doublePrecision("accuracy"),
    locationLabel: text("location_label").notNull().default(""),
    sent: boolean("sent").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("doctors_user_idx").on(t.userId)],
);

export const orders = pgTable(
  "orders",
  {
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
    accuracy: doublePrecision("accuracy"),
    locationLabel: text("location_label").notNull().default(""),
    items: jsonb("items").$type<Record<string, number>>().notNull().default({}),
    distributor: varchar("distributor", { length: 160 }).notNull().default(""),
    visitor: varchar("visitor", { length: 160 }).notNull().default(""),
    notes: text("notes").notNull().default(""),
    sendStatus: text("send_status").notNull().default(""),
    sent: boolean("sent").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("orders_user_idx").on(t.userId)],
);

// dropdown lists: specialty | distributor | visitor | province | city | region
export const options = pgTable("options", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 40 }).notNull(),
  value: varchar("value", { length: 200 }).notNull(),
  createdBy: varchar("created_by", { length: 160 }).notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const homes = pgTable("homes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  repName: varchar("rep_name", { length: 160 }).notNull(),
  title: varchar("title", { length: 160 }).notNull().default("منزل"),
  address: text("address").notNull().default(""),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  accuracy: doublePrecision("accuracy"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leaves = pgTable("leaves", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  repName: varchar("rep_name", { length: 160 }).notNull(),
  kind: varchar("kind", { length: 30 }).notNull().default("روزانه"),
  fromDate: varchar("from_date", { length: 12 }).notNull(),
  toDate: varchar("to_date", { length: 12 }).notNull(),
  days: integer("days").notNull().default(1),
  fromTime: varchar("from_time", { length: 5 }).notNull().default(""),
  toTime: varchar("to_time", { length: 5 }).notNull().default(""),
  hours: doublePrecision("hours").notNull().default(0),
  reason: text("reason").notNull().default(""),
  supervisorStatus: varchar("supervisor_status", { length: 20 }).notNull().default("pending"),
  supervisorNote: varchar("supervisor_note", { length: 300 }).notNull().default(""),
  supervisorName: varchar("supervisor_name", { length: 160 }).notNull().default(""),
  managerStatus: varchar("manager_status", { length: 20 }).notNull().default("pending"),
  managerNote: varchar("manager_note", { length: 300 }).notNull().default(""),
  managerName: varchar("manager_name", { length: 160 }).notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  repName: varchar("rep_name", { length: 160 }).notNull(),
  dateShamsi: varchar("date_shamsi", { length: 12 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
});

export const tripPoints = pgTable(
  "trip_points",
  {
    id: serial("id").primaryKey(),
    tripId: integer("trip_id").notNull(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    accuracy: doublePrecision("accuracy"),
    kind: varchar("kind", { length: 20 }).notNull().default("move"),
    note: varchar("note", { length: 200 }).notNull().default(""),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
    synced: boolean("synced").notNull().default(true),
  },
  (t) => [index("trip_points_trip_idx").on(t.tripId)],
);

export const messengers = pgTable("messengers", {
  id: serial("id").primaryKey(),
  platform: varchar("platform", { length: 20 }).notNull(),
  label: varchar("label", { length: 160 }).notNull().default(""),
  targetType: varchar("target_type", { length: 20 }).notNull().default("phone"),
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

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    toUserId: integer("to_user_id"), // null = همه مدیران
    toRole: varchar("to_role", { length: 20 }).notNull().default(""),
    fromName: varchar("from_name", { length: 160 }).notNull().default(""),
    kind: varchar("kind", { length: 40 }).notNull().default("info"),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body").notNull().default(""),
    link: varchar("link", { length: 200 }).notNull().default(""),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notif_user_idx").on(t.toUserId)],
);

export const settings = pgTable("settings", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const attachments = pgTable(
  "attachments",
  {
    id: serial("id").primaryKey(),
    ownerType: varchar("owner_type", { length: 30 }).notNull().default("doctor"),
    ownerId: integer("owner_id"),
    userId: integer("user_id").notNull(),
    repName: varchar("rep_name", { length: 160 }).notNull().default(""),
    fileName: varchar("file_name", { length: 200 }).notNull().default("file"),
    mimeType: varchar("mime_type", { length: 100 }).notNull().default("application/octet-stream"),
    size: integer("size").notNull().default(0),
    data: text("data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("attach_owner_idx").on(t.ownerType, t.ownerId)],
);

/** سمت‌های سازمانی قابل تعریف توسط مدیر (نماینده علمی، کارشناس فروش، سرپرست و ...) */
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 40 }).notNull().unique(),
  label: varchar("label", { length: 120 }).notNull(),
  base: varchar("base", { length: 20 }).notNull().default("rep"), // admin | supervisor | rep
  permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
  builtin: boolean("builtin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
