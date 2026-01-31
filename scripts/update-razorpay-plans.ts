import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { plans } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * This script updates the Razorpay plan IDs in the database.
 *
 * Usage:
 * 1. Create plans in Razorpay Dashboard (Subscriptions → Plans)
 * 2. Copy the plan IDs from Razorpay
 * 3. Update the RAZORPAY_PLAN_IDS object below
 * 4. Run: pnpm tsx scripts/update-razorpay-plans.ts
 */

// Update these with your Razorpay plan IDs from the dashboard
const RAZORPAY_PLAN_IDS = {
  weekly_weekday: "plan_SAXgNrBmNY7vpA", // e.g., "plan_xxxxxxxxxxxxx"
  monthly_weekday: "plan_SAXgl6K0QYoTKI", // e.g., "plan_xxxxxxxxxxxxx"
  anytime: "plan_SAXhBnXG2H3pMw", // e.g., "plan_xxxxxxxxxxxxx"
};

async function updateRazorpayPlans() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  // Check if all plan IDs are provided
  for (const [slug, id] of Object.entries(RAZORPAY_PLAN_IDS)) {
    if (!id) {
      console.error(`Missing Razorpay plan ID for ${slug}`);
      console.error("Please update RAZORPAY_PLAN_IDS in this script with your Razorpay plan IDs");
      process.exit(1);
    }
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log("Updating Razorpay plan IDs...");

  for (const [slug, razorpayPlanId] of Object.entries(RAZORPAY_PLAN_IDS)) {
    await db
      .update(plans)
      .set({ razorpayPlanId })
      .where(eq(plans.slug, slug as "weekly_weekday" | "monthly_weekday" | "anytime"));

    console.log(`Updated ${slug} with Razorpay plan ID: ${razorpayPlanId}`);
  }

  console.log("Done!");
}

updateRazorpayPlans().catch((err) => {
  console.error("Update failed:", err);
  process.exit(1);
});
