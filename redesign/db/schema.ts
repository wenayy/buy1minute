import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  role: text("role", { enum: ["owner", "admin"] }).notNull().default("owner"),
  createdAt: text("created_at").notNull(),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  websiteUrl: text("website_url").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  category: text("category"),
  logoKey: text("logo_key"),
  screenshotKey: text("screenshot_key"),
  backgroundKey: text("background_key"),
  accentColor: text("accent_color").notNull().default("#ff4e24"),
  socialHandle: text("social_handle"),
  disabledAt: text("disabled_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("idx_products_user_id").on(table.userId),
  index("idx_products_slug").on(table.slug),
]);

export const minutePricing = sqliteTable("minute_pricing", {
  minuteIndex: integer("minute_index").primaryKey(),
  amountCents: integer("amount_cents"),
  pricingType: text("pricing_type", { enum: ["standard", "fixed", "auction"] }).notNull(),
  label: text("label"),
  updatedAt: text("updated_at").notNull(),
});

export const ownerships = sqliteTable("ownerships", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  reservationId: text("reservation_id"),
  productId: text("product_id"),
  purchasedAt: text("purchased_at").notNull(),
  purchasePriceCents: integer("purchase_price_cents").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
}, (table) => [
  index("idx_ownerships_user_id_active").on(table.userId, table.active),
  index("idx_ownerships_active_product").on(table.active, table.productId),
]);

export const ownershipMinutes = sqliteTable("ownership_minutes", {
  ownershipId: text("ownership_id").notNull().references(() => ownerships.id),
  minuteIndex: integer("minute_index").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
}, (table) => [
  primaryKey({ columns: [table.ownershipId, table.minuteIndex] }),
  uniqueIndex("uq_active_ownership_per_minute").on(table.minuteIndex).where(sql`${table.active} = 1`),
]);

export const reservations = sqliteTable("reservations", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  clientHash: text("client_hash"),
  status: text("status", { enum: ["active", "expired", "converted", "cancelled", "outbid_refunded"] }).notNull(),
  expiresAt: text("expires_at").notNull(),
  expectedAmountCents: integer("expected_amount_cents").notNull().default(0),
  isOutbid: integer("is_outbid", { mode: "boolean" }).notNull().default(false),
  stripeSessionId: text("stripe_session_id").unique(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("idx_reservations_status_expires").on(table.status, table.expiresAt),
  index("idx_reservations_client_status").on(table.clientHash, table.status),
]);

export const reservationMinutes = sqliteTable("reservation_minutes", {
  reservationId: text("reservation_id").notNull().references(() => reservations.id),
  minuteIndex: integer("minute_index").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
}, (table) => [
  primaryKey({ columns: [table.reservationId, table.minuteIndex] }),
  uniqueIndex("uq_active_reserved_minute").on(table.minuteIndex).where(sql`${table.active} = 1`),
]);

export const paymentProviderSettings = sqliteTable("payment_provider_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  reservationId: text("reservation_id"),
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("usd"),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
});

export const analyticsEvents = sqliteTable("analytics_events", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  minuteIndex: integer("minute_index").notNull(),
  visitorHash: text("visitor_hash"),
  path: text("path"),
  occurredAt: text("occurred_at").notNull(),
}, (table) => [
  index("idx_events_minute_type_time").on(table.minuteIndex, table.eventType, table.occurredAt),
  index("idx_events_visitor_time").on(table.visitorHash, table.occurredAt),
]);

export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  minuteIndex: integer("minute_index").notNull(),
  reason: text("reason").notNull(),
  details: text("details").notNull(),
  reporterEmail: text("reporter_email").notNull(),
  status: text("status", { enum: ["open", "reviewing", "resolved", "dismissed"] }).notNull().default("open"),
  actionTaken: text("action_taken"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
}, (table) => [
  index("idx_reports_status").on(table.status),
  index("idx_reports_minute").on(table.minuteIndex),
]);
