import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, plans, subscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { validateBody, subscribeChangeSchema } from "@/lib/validation";
import { razorpay } from "@/lib/razorpay/client";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = validateBody(subscribeChangeSchema, body);
  if (!parsed.success) return parsed.response;

  const { newPlanId } = parsed.data;

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

  if (user.blocked) {
    return NextResponse.json(
      { error: "Your account has been suspended" },
      { status: 403 }
    );
  }

  // Get the new plan
  const [newPlan] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.id, newPlanId), eq(plans.active, true)));

  if (!newPlan) {
    return NextResponse.json(
      { error: "Plan not found" },
      { status: 404 }
    );
  }

  if (!newPlan.razorpayPlanId) {
    return NextResponse.json(
      { error: "Plan is not configured for payments" },
      { status: 400 }
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

  // Check if trying to change to the same plan
  if (subscription.planId === newPlanId) {
    return NextResponse.json(
      { error: "You are already on this plan" },
      { status: 400 }
    );
  }

  // Check if there's already a pending plan change
  if (subscription.pendingPlanChangeId) {
    return NextResponse.json(
      { error: "You already have a pending plan change" },
      { status: 400 }
    );
  }

  // Schedule the plan change in Razorpay
  await razorpay.subscriptions.update(subscription.razorpaySubscriptionId, {
    plan_id: newPlan.razorpayPlanId,
    schedule_change_at: "cycle_end",
    customer_notify: true,
  });

  // Store pending plan change in DB for UI display
  await db
    .update(subscriptions)
    .set({
      pendingPlanChangeId: newPlanId,
    })
    .where(eq(subscriptions.id, subscription.id));

  return NextResponse.json({
    message: "Plan change scheduled for next billing cycle",
    newPlanId,
    effectiveDate: subscription.currentPeriodEnd,
  });
}

export async function DELETE() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

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

  if (!subscription.pendingPlanChangeId) {
    return NextResponse.json(
      { error: "No pending plan change to cancel" },
      { status: 400 }
    );
  }

  // Get current plan to revert Razorpay back to it
  const [currentPlan] = await db
    .select()
    .from(plans)
    .where(eq(plans.id, subscription.planId));

  if (!currentPlan?.razorpayPlanId) {
    return NextResponse.json(
      { error: "Current plan is not configured for payments" },
      { status: 500 }
    );
  }

  // Revert the scheduled change in Razorpay
  await razorpay.subscriptions.update(subscription.razorpaySubscriptionId, {
    plan_id: currentPlan.razorpayPlanId,
    schedule_change_at: "cycle_end",
    customer_notify: false,
  });

  // Clear the pending plan change in DB
  await db
    .update(subscriptions)
    .set({
      pendingPlanChangeId: null,
    })
    .where(eq(subscriptions.id, subscription.id));

  return NextResponse.json({
    message: "Pending plan change cancelled",
  });
}
