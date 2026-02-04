import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { users, subscriptions, plans, sessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { razorpay } from "@/lib/razorpay/client";
import { deleteCalendarEvent } from "@/lib/google-calendar/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.response;

  const { id: userId } = await params;
  const body = await request.json();
  const { reason, blockUser } = body;

  if (!reason?.trim()) {
    return NextResponse.json(
      { error: "Reason is required" },
      { status: 400 }
    );
  }

  // 1. Find user
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 2. Find active subscription + plan
  const [subWithPlan] = await db
    .select({
      subscription: subscriptions,
      plan: plans,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active")
      )
    );

  if (!subWithPlan) {
    return NextResponse.json(
      { error: "No active subscription found for this user" },
      { status: 400 }
    );
  }

  const { subscription, plan } = subWithPlan;

  // 3. Calculate pro-rata refund
  const unusedSessions =
    plan.sessionsPerPeriod - subscription.sessionsUsedThisPeriod;
  const costPerSession = Math.floor(plan.priceInr / plan.sessionsPerPeriod);
  const refundAmountInr = Math.max(0, unusedSessions * costPerSession);
  const refundAmountPaise = refundAmountInr * 100;

  // 4. Cancel Razorpay subscription
  try {
    await razorpay.subscriptions.cancel(subscription.razorpaySubscriptionId);
  } catch (err) {
    console.error("Failed to cancel Razorpay subscription:", err);
    return NextResponse.json(
      { error: "Failed to cancel Razorpay subscription" },
      { status: 500 }
    );
  }

  // 5. Issue refund using stored payment ID from webhook
  if (refundAmountPaise > 0 && subscription.latestPaymentId) {
    try {
      await razorpay.payments.refund(subscription.latestPaymentId, {
        amount: refundAmountPaise,
      });
    } catch (err) {
      // Log but don't fail — subscription is already cancelled
      console.error("Failed to issue refund:", err);
    }
  }

  // 6. Update subscription status
  await db
    .update(subscriptions)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelReason: reason.trim(),
    })
    .where(eq(subscriptions.id, subscription.id));

  // 7. Optionally block user
  if (blockUser) {
    await db
      .update(users)
      .set({ blocked: true })
      .where(eq(users.id, userId));
  }

  // 8. Cancel pending sessions + delete calendar events
  const pendingSessions = await db
    .select()
    .from(sessions)
    .where(
      and(eq(sessions.userId, userId), eq(sessions.status, "scheduled"))
    );

  for (const s of pendingSessions) {
    if (s.googleEventId) {
      try {
        await deleteCalendarEvent(s.googleEventId);
      } catch (err) {
        console.error(`Failed to delete calendar event ${s.googleEventId}:`, err);
      }
    }
    await db
      .update(sessions)
      .set({
        status: "cancelled_by_mentor",
        cancelledAt: new Date(),
      })
      .where(eq(sessions.id, s.id));
  }

  return NextResponse.json({
    success: true,
    refundAmountInr,
    sessionsAffected: pendingSessions.length,
    userBlocked: !!blockUser,
  });
}
