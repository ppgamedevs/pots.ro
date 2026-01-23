import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";

// Settings table for admin-controlled configuration
export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  stagedValue: text("staged_value"),
  stagedEffectiveAt: timestamp("staged_effective_at", { withTimezone: true }),
  stagedAt: timestamp("staged_at", { withTimezone: true }),
  stagedBy: text("staged_by"), // email or userId of admin who staged
  description: text("description"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  updatedBy: text("updated_by"), // email or userId of admin who updated
});

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;

