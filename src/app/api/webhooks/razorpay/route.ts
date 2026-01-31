import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, plans } from "@/lib/db/schema";
import { razorpay } from "@/lib/razorpay/client";
import {
  verifyWebhookSignature,
  type RazorpayWebhookPayload,
} from "@/lib/razorpay/webhook";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  if (!verifyWebhookSignature(body, signature, webhookSecret)) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  const payload: RazorpayWebhookPayload = JSON.parse(body);
  const razorpaySubscription = payload.payload.subscription.entity;

  console.log(`Received webhook: ${payload.event}`, {
    subscriptionId: razorpaySubscription.id,
    status: razorpaySubscription.status,
  });

  switch (payload.event) {
    case "subscription.activated":
      await handleSubscriptionActivated(razorpaySubscription);
      break;

    case "subscription.charged":
      await handleSubscriptionCharged(razorpaySubscription);
      break;

    case "subscription.cancelled":
      await handleSubscriptionCancelled(razorpaySubscription);
      break;

    case "subscription.paused":
    case "subscription.halted":
      await handleSubscriptionPaused(razorpaySubscription);
      break;

    case "subscription.resumed":
      await handleSubscriptionResumed(razorpaySubscription);
      break;

    default:
      console.log(`Unhandled event: ${payload.event}`);
  }

  return NextResponse.json({ received: true });
}

async function handleSubscriptionActivated(
  razorpaySubscription: RazorpayWebhookPayload["payload"]["subscription"]["entity"]
) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubscription.id));

  if (!subscription) {
    console.error(
      `Subscription not found for Razorpay ID: ${razorpaySubscription.id}`
    );
    return;
  }

  const periodStart = new Date(razorpaySubscription.current_start * 1000);
  const periodEnd = new Date(razorpaySubscription.current_end * 1000);

  await db
    .update(subscriptions)
    .set({
      status: "active",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      sessionsUsedThisPeriod: 0,
    })
    .where(eq(subscriptions.id, subscription.id));

  console.log(`Subscription activated: ${subscription.id}`);
}

async function handleSubscriptionCharged(
  razorpaySubscription: RazorpayWebhookPayload["payload"]["subscription"]["entity"]
) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubscription.id));

  if (!subscription) {
    console.error(
      `Subscription not found for Razorpay ID: ${razorpaySubscription.id}`
    );
    return;
  }

  const periodStart = new Date(razorpaySubscription.current_start * 1000);
  const periodEnd = new Date(razorpaySubscription.current_end * 1000);

  // Check if there's a pending plan change
  if (subscription.pendingPlanChangeId) {
    const [newPlan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, subscription.pendingPlanChangeId));

    if (newPlan?.razorpayPlanId) {
      // Cancel old Razorpay subscription
      await razorpay.subscriptions.cancel(razorpaySubscription.id);

      // Create new subscription on new plan
      const newRzpSub = await razorpay.subscriptions.create({
        plan_id: newPlan.razorpayPlanId,
        total_count: 120,
        customer_notify: 1,
        notes: {
          user_id: subscription.userId,
          plan_id: newPlan.id,
        },
      });

      // Update subscription with new plan
      await db
        .update(subscriptions)
        .set({
          planId: newPlan.id,
          razorpaySubscriptionId: newRzpSub.id,
          pendingPlanChangeId: null,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          sessionsUsedThisPeriod: 0,
          status: "active",
        })
        .where(eq(subscriptions.id, subscription.id));

      console.log(`Plan changed for subscription: ${subscription.id}`);
      return;
    }
  }

  // Normal renewal - reset session counter
  await db
    .update(subscriptions)
    .set({
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      sessionsUsedThisPeriod: 0,
      status: "active",
    })
    .where(eq(subscriptions.id, subscription.id));

  console.log(`Subscription renewed: ${subscription.id}`);
}

async function handleSubscriptionCancelled(
  razorpaySubscription: RazorpayWebhookPayload["payload"]["subscription"]["entity"]
) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubscription.id));

  if (!subscription) {
    console.error(
      `Subscription not found for Razorpay ID: ${razorpaySubscription.id}`
    );
    return;
  }

  await db
    .update(subscriptions)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
    })
    .where(eq(subscriptions.id, subscription.id));

  console.log(`Subscription cancelled: ${subscription.id}`);
}

async function handleSubscriptionPaused(
  razorpaySubscription: RazorpayWebhookPayload["payload"]["subscription"]["entity"]
) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubscription.id));

  if (!subscription) {
    console.error(
      `Subscription not found for Razorpay ID: ${razorpaySubscription.id}`
    );
    return;
  }

  await db
    .update(subscriptions)
    .set({
      status: "past_due",
    })
    .where(eq(subscriptions.id, subscription.id));

  console.log(`Subscription paused/halted: ${subscription.id}`);
}

async function handleSubscriptionResumed(
  razorpaySubscription: RazorpayWebhookPayload["payload"]["subscription"]["entity"]
) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubscription.id));

  if (!subscription) {
    console.error(
      `Subscription not found for Razorpay ID: ${razorpaySubscription.id}`
    );
    return;
  }

  const periodStart = new Date(razorpaySubscription.current_start * 1000);
  const periodEnd = new Date(razorpaySubscription.current_end * 1000);

  await db
    .update(subscriptions)
    .set({
      status: "active",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    })
    .where(eq(subscriptions.id, subscription.id));

  console.log(`Subscription resumed: ${subscription.id}`);
}
