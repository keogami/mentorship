import { pgEnum, pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { plans } from "./plans";

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "pending",
  "active",
  "cancelled",
  "past_due",
]);

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  razorpaySubscriptionId: text("razorpay_subscription_id").notNull(),
  planId: text("plan_id")
    .notNull()
    .references(() => plans.id),
  status: subscriptionStatusEnum("status").notNull(),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  sessionsUsedThisPeriod: integer("sessions_used_this_period").default(0).notNull(),
  pendingPlanChangeId: text("pending_plan_change_id").references(() => plans.id),
  latestPaymentId: text("latest_payment_id"),
  cancelledAt: timestamp("cancelled_at"),
  cancelReason: text("cancel_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptionCredits = pgTable("subscription_credits", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  subscriptionId: text("subscription_id")
    .notNull()
    .references(() => subscriptions.id),
  days: integer("days").notNull(),
  reason: text("reason").notNull(),
  blockId: text("block_id"), // No FK - credits persist even if block deleted
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
