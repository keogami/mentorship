import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(), // Razorpay event ID
  event: text("event").notNull(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
});
