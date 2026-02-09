import { and, eq, sum } from "drizzle-orm"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { PaymentPendingCard } from "@/components/dashboard/payment-pending-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { db } from "@/lib/db"
import {
  plans,
  subscriptionCredits,
  subscriptions,
  users,
} from "@/lib/db/schema"
import { getActivePack } from "@/lib/packs"

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

function formatPrice(priceInr: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(priceInr)
}

function getStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default"
    case "pending":
      return "secondary"
    case "cancelled":
    case "past_due":
      return "destructive"
    default:
      return "outline"
  }
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect("/subscribe")
  }

  // Redirect mentor to admin dashboard
  if (session.user.email === process.env.MENTOR_EMAIL) {
    redirect("/admin")
  }

  // Get user from database
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))

  if (!user) {
    redirect("/subscribe")
  }

  // Get active subscription with plan
  const subscriptionWithPlan = await db
    .select({
      subscription: subscriptions,
      plan: plans,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(
      and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active"))
    )
    .limit(1)

  const activeSubscription = subscriptionWithPlan[0]

  // Fetch active pack
  const activePack = await getActivePack(user.id)

  // If no active subscription, check for pending
  if (!activeSubscription) {
    const pendingSubscription = await db
      .select({
        subscription: subscriptions,
        plan: plans,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(
        and(
          eq(subscriptions.userId, user.id),
          eq(subscriptions.status, "pending")
        )
      )
      .limit(1)

    if (pendingSubscription[0]) {
      return (
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-2xl">
            <PaymentPendingCard />
          </div>
        </div>
      )
    }

    // No subscription — show pack if available, otherwise prompt to subscribe
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.name}</p>
          </div>

          {activePack && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Session Pack</CardTitle>
                    <CardDescription>
                      Book any day including weekends
                    </CardDescription>
                  </div>
                  <Badge>active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Sessions</p>
                  <p className="text-2xl font-bold">
                    {activePack.sessionsRemaining} / {activePack.sessionsTotal}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expires {formatDate(activePack.expiresAt)}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild>
                  <Link href="/book">Book Session</Link>
                </Button>
              </CardFooter>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>
                {activePack ? "Get a Subscription" : "No Active Subscription"}
              </CardTitle>
              <CardDescription>
                {activePack
                  ? "Subscribe for more sessions and better value"
                  : "Subscribe to start booking mentorship sessions"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Choose a plan that fits your learning schedule and start your
                mentorship journey today.
              </p>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button asChild>
                <Link href="/subscribe">View Plans</Link>
              </Button>
              {!activePack && (
                <Button variant="outline" asChild>
                  <Link href="/redeem">Redeem Coupon</Link>
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Redeem a Coupon</CardTitle>
              <CardDescription>
                Have a coupon code? Redeem it for session credits.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link href="/redeem">Redeem Coupon</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  const { subscription, plan } = activeSubscription

  // Calculate bonus days from credits
  const [creditsResult] = await db
    .select({ totalDays: sum(subscriptionCredits.days) })
    .from(subscriptionCredits)
    .where(eq(subscriptionCredits.subscriptionId, subscription.id))

  const bonusDays = Number(creditsResult?.totalDays) || 0
  const effectiveEndDate = new Date(subscription.currentPeriodEnd)
  effectiveEndDate.setDate(effectiveEndDate.getDate() + bonusDays)

  const sessionsRemaining =
    plan.sessionsPerPeriod +
    subscription.carryOverSessions -
    subscription.sessionsUsedThisPeriod
  const period = plan.period === "weekly" ? "week" : "month"

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  {formatPrice(plan.priceInr)}/{period}
                </CardDescription>
              </div>
              <Badge variant={getStatusBadgeVariant(subscription.status)}>
                {subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Sessions Used</p>
                <p className="text-2xl font-bold">
                  {subscription.sessionsUsedThisPeriod} /{" "}
                  {plan.sessionsPerPeriod + subscription.carryOverSessions}
                </p>
                <p className="text-sm text-muted-foreground">
                  {sessionsRemaining} remaining this {period}
                </p>
                {subscription.carryOverSessions > 0 && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    includes {subscription.carryOverSessions} carried over
                  </p>
                )}
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Current Period</p>
                <p className="text-lg font-medium">
                  {formatDate(subscription.currentPeriodStart)} -{" "}
                  {formatDate(subscription.currentPeriodEnd)}
                </p>
                {bonusDays > 0 && (
                  <p className="text-sm text-green-600">
                    +{bonusDays} bonus days (until{" "}
                    {formatDate(effectiveEndDate)})
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Plan Features</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>
                  {plan.sessionsPerPeriod} sessions per {period}
                </li>
                <li>
                  {plan.weekendAccess
                    ? "Book any day including weekends"
                    : "Mon-Fri booking only"}
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button asChild disabled={sessionsRemaining <= 0}>
              <Link href="/book">Book Session</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/settings">Manage Subscription</Link>
            </Button>
          </CardFooter>
        </Card>

        {activePack && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Session Pack</CardTitle>
                  <CardDescription>
                    Book any day including weekends
                  </CardDescription>
                </div>
                <Badge>active</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Sessions</p>
                <p className="text-2xl font-bold">
                  {activePack.sessionsRemaining} / {activePack.sessionsTotal}
                </p>
                <p className="text-sm text-muted-foreground">
                  Expires {formatDate(activePack.expiresAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" asChild className="justify-start">
              <Link href="/sessions">View Session History</Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/settings">Change Plan</Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/redeem">Redeem Coupon</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
