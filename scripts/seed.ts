import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { plans, mentorConfig } from "../src/lib/db/schema";

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log("Seeding database...");

  // Seed plans
  const planData = [
    {
      id: crypto.randomUUID(),
      name: "Weekly Weekday",
      slug: "weekly_weekday" as const,
      priceInr: 3000,
      sessionsPerPeriod: 3,
      period: "weekly" as const,
      weekendAccess: false,
    },
    {
      id: crypto.randomUUID(),
      name: "Monthly Weekday",
      slug: "monthly_weekday" as const,
      priceInr: 9600,
      sessionsPerPeriod: 12,
      period: "monthly" as const,
      weekendAccess: false,
    },
    {
      id: crypto.randomUUID(),
      name: "Anytime",
      slug: "anytime" as const,
      priceInr: 10000,
      sessionsPerPeriod: 8,
      period: "monthly" as const,
      weekendAccess: true,
    },
  ];

  console.log("Inserting plans...");
  await db.insert(plans).values(planData).onConflictDoNothing();
  console.log("Plans seeded successfully");

  // Seed mentor config singleton
  console.log("Inserting mentor config...");
  await db
    .insert(mentorConfig)
    .values({
      id: "singleton",
      maxSessionsPerDay: 5,
      bookingWindowDays: 7,
      cancellationNoticeHours: 4,
    })
    .onConflictDoNothing();
  console.log("Mentor config seeded successfully");

  console.log("Database seeding complete!");
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
