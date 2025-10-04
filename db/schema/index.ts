import { pgTable, serial, text, timestamp, boolean, integer, varchar, uuid, pgEnum, jsonb, index } from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum('user_role', ['buyer', 'seller', 'admin']);
export const auditKindEnum = pgEnum('audit_kind', [
  'otp_request',
  'otp_verify', 
  'login',
  'logout',
  'rate_limit',
  'otp_expired',
  'otp_denied'
]);

// Users table for passwordless auth
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: userRoleEnum("role").default('buyer').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
}));

// Auth OTP table for passwordless authentication
export const authOtp = pgTable("auth_otp", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  codeHash: varchar("code_hash", { length: 255 }).notNull(),
  magicTokenHash: varchar("magic_token_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  consumedAt: timestamp("consumed_at"),
  ip: text("ip"),
  userAgent: text("ua"),
  attempts: integer("attempts").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  emailExpiresIdx: index("auth_otp_email_expires_idx").on(table.email, table.expiresAt),
}));

// Sessions table for httpOnly cookies
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  sessionTokenHash: varchar("session_token_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  ip: text("ip"),
  userAgent: text("ua"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
}, (table) => ({
  userIdExpiresIdx: index("sessions_user_id_expires_idx").on(table.userId, table.expiresAt),
}));

// Auth audit table for security logging
export const authAudit = pgTable("auth_audit", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: auditKindEnum("kind").notNull(),
  email: text("email"),
  userId: uuid("user_id").references(() => users.id),
  ip: text("ip"),
  userAgent: text("ua"),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Example table for pots/products (keeping existing)
export const pots = pgTable("pots", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price").notNull(),
  imageUrl: text("image_url"),
  userId: text("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
