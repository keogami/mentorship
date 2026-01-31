import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const coupons = pgTable("coupons", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(),
  sessionsGranted: integer("sessions_granted").notNull(),
  expiresAt: timestamp("expires_at"),
  maxUses: integer("max_uses"),
  uses: integer("uses").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const couponRedemptions = pgTable("coupon_redemptions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  couponId: text("coupon_id")
    .notNull()
    .references(() => coupons.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  sessionsGranted: integer("sessions_granted").notNull(),
  sessionsRemaining: integer("sessions_remaining").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
