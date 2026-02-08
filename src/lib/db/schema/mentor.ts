import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

export const mentorBlocks = pgTable("mentor_blocks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason").notNull(),
  usersNotified: boolean("users_notified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const mentorConfig = pgTable("mentor_config", {
  id: text("id").primaryKey().default("singleton"),
  maxSessionsPerDay: integer("max_sessions_per_day").default(5).notNull(),
  bookingWindowDays: integer("booking_window_days").default(7).notNull(),
  cancellationNoticeHours: integer("cancellation_notice_hours")
    .default(4)
    .notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
