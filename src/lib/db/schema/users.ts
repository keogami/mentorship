import { boolean, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const authProviderEnum = pgEnum("auth_provider", ["github", "google"])

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  provider: authProviderEnum("provider").notNull(),
  providerId: text("provider_id").notNull(),
  image: text("image"),
  blocked: boolean("blocked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
