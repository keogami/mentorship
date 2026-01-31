import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  generateSlots,
  getUserSubscriptionWithPlan,
  hasPendingSession,
} from "@/lib/booking";

export async function GET() {
  const session = await auth();

  let userId: string | null = null;
  let weekendAccess = false;
  let userHasPendingSession = false;
  let sessionsRemaining = 0;
  let hasActiveSubscription = false;

  if (session?.user?.email) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email));

    if (user) {
      userId = user.id;

      const subscription = await getUserSubscriptionWithPlan(user.id);
      if (subscription && subscription.status === "active") {
        hasActiveSubscription = true;
        weekendAccess = subscription.plan.weekendAccess;
        sessionsRemaining =
          subscription.plan.sessionsPerPeriod -
          subscription.sessionsUsedThisPeriod;
        userHasPendingSession = await hasPendingSession(user.id);
      }
    }
  }

  const days = await generateSlots(userId, weekendAccess, userHasPendingSession);

  return NextResponse.json({
    days,
    userContext: userId
      ? {
          sessionsRemaining,
          hasPendingSession: userHasPendingSession,
          weekendAccess,
          hasActiveSubscription,
        }
      : null,
  });
}
