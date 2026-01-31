import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, subscriptions } from "@/lib/db/schema";
import { razorpay } from "@/lib/razorpay/client";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { reason } = body;

  // Get user from database
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email));

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  // Get user's active subscription
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, user.id),
        eq(subscriptions.status, "active")
      )
    );

  if (!subscription) {
    return NextResponse.json(
      { error: "No active subscription found" },
      { status: 404 }
    );
  }

  // Cancel subscription at cycle end in Razorpay
  // Note: Razorpay doesn't support cancel_at_cycle_end directly,
  // we need to use the update method to schedule cancellation
  try {
    await razorpay.subscriptions.cancel(subscription.razorpaySubscriptionId);
  } catch (error) {
    console.error("Failed to cancel Razorpay subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription with payment provider" },
      { status: 500 }
    );
  }

  // Update subscription in our database
  await db
    .update(subscriptions)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelReason: reason || "User requested cancellation",
    })
    .where(eq(subscriptions.id, subscription.id));

  return NextResponse.json({
    message: "Subscription cancelled successfully",
    effectiveDate: subscription.currentPeriodEnd,
  });
}
