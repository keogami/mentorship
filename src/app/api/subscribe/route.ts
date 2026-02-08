import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { plans, subscriptions, users } from "@/lib/db/schema"
import { razorpay } from "@/lib/razorpay/client"
import { subscribeSchema, validateBody } from "@/lib/validation"

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    )
  }

  const body = await request.json()
  const parsed = validateBody(subscribeSchema, body)
  if (!parsed.success) return parsed.response

  const { planId } = parsed.data

  // Get the plan
  const [plan] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.id, planId), eq(plans.active, true)))

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 })
  }

  if (!plan.razorpayPlanId) {
    return NextResponse.json(
      { error: "Plan is not configured for payments" },
      { status: 400 }
    )
  }

  // Get or create user in our database
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))

  if (!user) {
    const [newUser] = await db
      .insert(users)
      .values({
        email: session.user.email,
        name: session.user.name || session.user.email,
        provider: session.user.provider as "github" | "google",
        providerId: session.user.providerAccountId,
        image: session.user.image ?? null,
      })
      .returning()
    user = newUser
  }

  // Check if user is blocked
  if (user.blocked) {
    return NextResponse.json(
      { error: "Your account has been suspended. Please contact support." },
      { status: 403 }
    )
  }

  // Check if user already has an active subscription
  const [existingActiveSubscription] = await db
    .select()
    .from(subscriptions)
    .where(
      and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active"))
    )

  if (existingActiveSubscription) {
    return NextResponse.json(
      { error: "You already have an active subscription" },
      { status: 400 }
    )
  }

  // Clean up any abandoned pending subscriptions
  const pendingSubscriptions = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, user.id),
        eq(subscriptions.status, "pending")
      )
    )

  for (const pending of pendingSubscriptions) {
    // Cancel in Razorpay (ignore errors - may already be cancelled)
    try {
      await razorpay.subscriptions.cancel(pending.razorpaySubscriptionId)
    } catch {
      // Subscription may already be cancelled or in a state that can't be cancelled
    }

    // Delete from our database
    await db.delete(subscriptions).where(eq(subscriptions.id, pending.id))
  }

  // Create Razorpay subscription
  const razorpaySubscription = await razorpay.subscriptions.create({
    plan_id: plan.razorpayPlanId,
    total_count: 120, // ~10 years max billing cycles
    customer_notify: 1,
    notes: {
      user_id: user.id,
      plan_id: plan.id,
    },
  })

  // Calculate period dates
  const now = new Date()
  const periodEnd = new Date(now)
  if (plan.period === "weekly") {
    periodEnd.setDate(periodEnd.getDate() + 7)
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  }

  // Create subscription in database with pending status
  await db.insert(subscriptions).values({
    userId: user.id,
    razorpaySubscriptionId: razorpaySubscription.id,
    planId: plan.id,
    status: "pending",
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    sessionsUsedThisPeriod: 0,
  })

  return NextResponse.json({
    subscriptionId: razorpaySubscription.id,
  })
}
