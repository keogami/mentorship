import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

export const planSlugEnum = pgEnum("plan_slug", [
  "weekly_weekday",
  "monthly_weekday",
  "anytime",
])

export const planPeriodEnum = pgEnum("plan_period", ["weekly", "monthly"])

export const plans = pgTable("plans", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: planSlugEnum("slug").notNull().unique(),
  razorpayPlanId: text("razorpay_plan_id"),
  priceInr: integer("price_inr").notNull(),
  sessionsPerPeriod: integer("sessions_per_period").notNull(),
  period: planPeriodEnum("period").notNull(),
  weekendAccess: boolean("weekend_access").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
