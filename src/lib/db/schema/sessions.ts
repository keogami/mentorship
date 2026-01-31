import { pgEnum, pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { subscriptions } from "./subscriptions";

export const sessionStatusEnum = pgEnum("session_status", [
  "scheduled",
  "completed",
  "cancelled_by_user",
  "cancelled_by_mentor",
  "no_show",
]);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  subscriptionId: text("subscription_id").references(() => subscriptions.id),
  couponRedemptionId: text("coupon_redemption_id"), // FK added in coupons.ts to avoid circular deps
  googleEventId: text("google_event_id"),
  meetLink: text("meet_link"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  durationMinutes: integer("duration_minutes").default(50).notNull(),
  status: sessionStatusEnum("status").notNull(),
  cancelledAt: timestamp("cancelled_at"),
  lateCancel: boolean("late_cancel").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
