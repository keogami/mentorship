import { and, eq, sum } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  plans,
  sessions,
  subscriptionCredits,
  subscriptions,
  users,
  webhookEvents,
} from "@/lib/db/schema"
import {
  mentorAlertEmail,
  sendEmail,
  subscriptionActivatedEmail,
  subscriptionCancelledEmail,
} from "@/lib/email"
import { deleteCalendarEvent } from "@/lib/google-calendar/client"
import {
  type RazorpayWebhookPayload,
  verifyWebhookSignature,
} from "@/lib/razorpay/webhook"

export async function POST(request: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not configured")
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }

  const body = await request.text()
  const signature = request.headers.get("x-razorpay-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  if (!verifyWebhookSignature(body, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const payload: RazorpayWebhookPayload = JSON.parse(body)
  const razorpaySubscription = payload.payload.subscription.entity
  const razorpayPayment = payload.payload.payment?.entity

  // Idempotency check: skip already-processed events
  const eventId = `${payload.event}_${razorpaySubscription.id}_${payload.created_at}`
  try {
    await db.insert(webhookEvents).values({
      id: eventId,
      event: payload.event,
    })
  } catch {
    // Unique constraint violation = already processed
    console.log(`Webhook event already processed: ${eventId}`)
    return NextResponse.json({ received: true })
  }

  console.log(`Received webhook: ${payload.event}`, {
    subscriptionId: razorpaySubscription.id,
    status: razorpaySubscription.status,
    paymentId: razorpayPayment?.id,
  })

  switch (payload.event) {
    case "subscription.activated":
      await handleSubscriptionActivated(razorpaySubscription, razorpayPayment)
      break

    case "subscription.charged":
      await handleSubscriptionCharged(razorpaySubscription, razorpayPayment)
      break

    case "subscription.cancelled":
      await handleSubscriptionCancelled(razorpaySubscription)
      break

    case "subscription.paused":
    case "subscription.halted":
      await handleSubscriptionPaused(razorpaySubscription)
      break

    case "subscription.resumed":
      await handleSubscriptionResumed(razorpaySubscription)
      break

    default:
      console.log(`Unhandled event: ${payload.event}`)
  }

  return NextResponse.json({ received: true })
}

type RazorpayPaymentEntity = NonNullable<
  RazorpayWebhookPayload["payload"]["payment"]
>["entity"]

async function handleSubscriptionActivated(
  razorpaySubscription: RazorpayWebhookPayload["payload"]["subscription"]["entity"],
  razorpayPayment?: RazorpayPaymentEntity
) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubscription.id))

  if (!subscription) {
    console.error(
      `Subscription not found for Razorpay ID: ${razorpaySubscription.id}`
    )
    return
  }

  const periodStart = new Date(razorpaySubscription.current_start * 1000)
  const periodEnd = new Date(razorpaySubscription.current_end * 1000)

  // Compute carry-over sessions from bonus days
  const carryOver = await computeCarryOver(subscription)

  await db
    .update(subscriptions)
    .set({
      status: "active",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      sessionsUsedThisPeriod: 0,
      carryOverSessions: carryOver,
      razorpayCustomerId: razorpaySubscription.customer_id,
      ...(razorpayPayment?.id && {
        latestPaymentId: razorpayPayment.id,
      }),
    })
    .where(eq(subscriptions.id, subscription.id))

  // Delete consumed credits
  if (carryOver > 0) {
    await db
      .delete(subscriptionCredits)
      .where(eq(subscriptionCredits.subscriptionId, subscription.id))
  }

  // Send welcome email
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, subscription.userId))

    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, subscription.planId))

    if (user && plan) {
      const emailContent = await subscriptionActivatedEmail({
        userName: user.name,
        planName: plan.name,
        sessionsPerPeriod: plan.sessionsPerPeriod,
        period: plan.period,
      })
      await sendEmail({
        to: user.email,
        ...emailContent,
      })
    }
  } catch (err) {
    console.error("Failed to send welcome email:", err)
  }

  console.log(`Subscription activated: ${subscription.id}`)
}

async function handleSubscriptionCharged(
  razorpaySubscription: RazorpayWebhookPayload["payload"]["subscription"]["entity"],
  razorpayPayment?: RazorpayPaymentEntity
) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubscription.id))

  if (!subscription) {
    console.error(
      `Subscription not found for Razorpay ID: ${razorpaySubscription.id}`
    )
    return
  }

  const periodStart = new Date(razorpaySubscription.current_start * 1000)
  const periodEnd = new Date(razorpaySubscription.current_end * 1000)
  const paymentUpdate = razorpayPayment?.id
    ? { latestPaymentId: razorpayPayment.id }
    : {}

  // Detect plan change: compare Razorpay's plan_id against our current plan
  const [currentPlan] = await db
    .select()
    .from(plans)
    .where(eq(plans.id, subscription.planId))

  let planUpdate:
    | { planId: string; pendingPlanChangeId: null }
    | Record<string, never> = {}

  if (
    currentPlan &&
    currentPlan.razorpayPlanId !== razorpaySubscription.plan_id
  ) {
    // Plan changed — Razorpay executed the scheduled update
    const [newPlan] = await db
      .select()
      .from(plans)
      .where(eq(plans.razorpayPlanId, razorpaySubscription.plan_id))

    if (newPlan) {
      planUpdate = { planId: newPlan.id, pendingPlanChangeId: null }
      console.log(
        `Plan changed for subscription: ${subscription.id} (${currentPlan.slug} → ${newPlan.slug})`
      )
    } else {
      console.error(
        `Unknown Razorpay plan_id in webhook: ${razorpaySubscription.plan_id}`
      )

      try {
        const mentorEmail = process.env.MENTOR_EMAIL
        if (mentorEmail) {
          const emailContent = await mentorAlertEmail({
            title: "Unknown Razorpay Plan ID",
            message:
              "A subscription was charged with a Razorpay plan_id that doesn't match any plan in the database. The subscription was renewed but the plan was NOT updated.",
            details: {
              "Subscription ID": subscription.id,
              "Razorpay Subscription ID": razorpaySubscription.id,
              "Unknown Razorpay Plan ID": razorpaySubscription.plan_id,
              "Current Plan": currentPlan.slug,
            },
          })
          await sendEmail({ to: mentorEmail, ...emailContent })
        }
      } catch (err) {
        console.error("Failed to send mentor alert email:", err)
      }
    }
  }

  // Compute carry-over sessions from bonus days before resetting
  const carryOver = await computeCarryOver(subscription)

  // Renewal: reset session counter and update period (with plan change if applicable)
  await db
    .update(subscriptions)
    .set({
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      sessionsUsedThisPeriod: 0,
      carryOverSessions: carryOver,
      status: "active",
      razorpayCustomerId: razorpaySubscription.customer_id,
      ...paymentUpdate,
      ...planUpdate,
    })
    .where(eq(subscriptions.id, subscription.id))

  // Delete consumed credits
  if (carryOver > 0) {
    await db
      .delete(subscriptionCredits)
      .where(eq(subscriptionCredits.subscriptionId, subscription.id))
  }

  console.log(`Subscription renewed: ${subscription.id} (carry-over: ${carryOver})`)
}

async function handleSubscriptionCancelled(
  razorpaySubscription: RazorpayWebhookPayload["payload"]["subscription"]["entity"]
) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubscription.id))

  if (!subscription) {
    console.error(
      `Subscription not found for Razorpay ID: ${razorpaySubscription.id}`
    )
    return
  }

  // Cancel all pending sessions for this user
  const pendingSessions = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, subscription.userId),
        eq(sessions.status, "scheduled")
      )
    )

  for (const session of pendingSessions) {
    // Delete calendar event if exists
    if (session.googleEventId) {
      try {
        await deleteCalendarEvent(session.googleEventId)
      } catch (err) {
        console.error(
          `Failed to delete calendar event ${session.googleEventId}:`,
          err
        )
      }
    }

    // Mark session as cancelled
    await db
      .update(sessions)
      .set({
        status: "cancelled_by_user",
        cancelledAt: new Date(),
      })
      .where(eq(sessions.id, session.id))
  }

  await db
    .update(subscriptions)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
    })
    .where(eq(subscriptions.id, subscription.id))

  // Send cancellation email
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, subscription.userId))

    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, subscription.planId))

    if (user && plan) {
      const emailContent = await subscriptionCancelledEmail({
        userName: user.name,
        planName: plan.name,
      })
      await sendEmail({
        to: user.email,
        ...emailContent,
      })
    }
  } catch (err) {
    console.error("Failed to send cancellation email:", err)
  }

  console.log(
    `Subscription cancelled: ${subscription.id}, cancelled ${pendingSessions.length} pending sessions`
  )
}

async function handleSubscriptionPaused(
  razorpaySubscription: RazorpayWebhookPayload["payload"]["subscription"]["entity"]
) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubscription.id))

  if (!subscription) {
    console.error(
      `Subscription not found for Razorpay ID: ${razorpaySubscription.id}`
    )
    return
  }

  await db
    .update(subscriptions)
    .set({
      status: "past_due",
    })
    .where(eq(subscriptions.id, subscription.id))

  console.log(`Subscription paused/halted: ${subscription.id}`)
}

async function handleSubscriptionResumed(
  razorpaySubscription: RazorpayWebhookPayload["payload"]["subscription"]["entity"]
) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubscription.id))

  if (!subscription) {
    console.error(
      `Subscription not found for Razorpay ID: ${razorpaySubscription.id}`
    )
    return
  }

  const periodStart = new Date(razorpaySubscription.current_start * 1000)
  const periodEnd = new Date(razorpaySubscription.current_end * 1000)

  await db
    .update(subscriptions)
    .set({
      status: "active",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    })
    .where(eq(subscriptions.id, subscription.id))

  console.log(`Subscription resumed: ${subscription.id}`)
}

/**
 * Compute carry-over sessions for a subscription being renewed.
 * Carry-over = min(remaining sessions, bonus days from credits).
 * Returns 0 if no bonus days exist.
 */
async function computeCarryOver(subscription: {
  id: string
  sessionsUsedThisPeriod: number
  carryOverSessions: number
  planId: string
}): Promise<number> {
  // Get bonus days from subscription credits
  const [creditsResult] = await db
    .select({ totalDays: sum(subscriptionCredits.days) })
    .from(subscriptionCredits)
    .where(eq(subscriptionCredits.subscriptionId, subscription.id))

  const bonusDays = Number(creditsResult?.totalDays) || 0
  if (bonusDays <= 0) return 0

  // Get plan to know sessionsPerPeriod
  const [plan] = await db
    .select({ sessionsPerPeriod: plans.sessionsPerPeriod })
    .from(plans)
    .where(eq(plans.id, subscription.planId))

  if (!plan) return 0

  const totalAvailable =
    plan.sessionsPerPeriod +
    subscription.carryOverSessions -
    subscription.sessionsUsedThisPeriod
  const remaining = Math.max(0, totalAvailable)

  return Math.min(remaining, bonusDays)
}
