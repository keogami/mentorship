import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, subscriptions, plans, subscriptionCredits } from "@/lib/db/schema";
import { eq, and, sum } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatPrice(priceInr: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(priceInr);
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default";
    case "pending":
      return "secondary";
    case "cancelled":
    case "past_due":
      return "destructive";
    default:
      return "outline";
  }
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/subscribe");
  }

  // Get user from database
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email));

  if (!user) {
    redirect("/subscribe");
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
      and(
        eq(subscriptions.userId, user.id),
        eq(subscriptions.status, "active")
      )
    )
    .limit(1);

  const activeSubscription = subscriptionWithPlan[0];

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
      .limit(1);

    if (pendingSubscription[0]) {
      return (
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Payment Pending</CardTitle>
                <CardDescription>
                  Your subscription is awaiting payment confirmation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Please complete your payment to activate your subscription.
                  If you&apos;ve already paid, it may take a few moments to process.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline">
                  <Link href="/subscribe">Return to Plans</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      );
    }

    // No subscription at all
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>No Active Subscription</CardTitle>
              <CardDescription>
                Subscribe to start booking mentorship sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Choose a plan that fits your learning schedule and start your
                mentorship journey today.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/subscribe">View Plans</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  const { subscription, plan } = activeSubscription;

  // Calculate bonus days from credits
  const [creditsResult] = await db
    .select({ totalDays: sum(subscriptionCredits.days) })
    .from(subscriptionCredits)
    .where(eq(subscriptionCredits.subscriptionId, subscription.id));

  const bonusDays = Number(creditsResult?.totalDays) || 0;
  const effectiveEndDate = new Date(subscription.currentPeriodEnd);
  effectiveEndDate.setDate(effectiveEndDate.getDate() + bonusDays);

  const sessionsRemaining = plan.sessionsPerPeriod - subscription.sessionsUsedThisPeriod;
  const period = plan.period === "weekly" ? "week" : "month";

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name}
          </p>
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
                  {subscription.sessionsUsedThisPeriod} / {plan.sessionsPerPeriod}
                </p>
                <p className="text-sm text-muted-foreground">
                  {sessionsRemaining} remaining this {period}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Current Period</p>
                <p className="text-lg font-medium">
                  {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                </p>
                {bonusDays > 0 && (
                  <p className="text-sm text-green-600">
                    +{bonusDays} bonus days (until {formatDate(effectiveEndDate)})
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Plan Features</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>{plan.sessionsPerPeriod} sessions per {period}</li>
                <li>{plan.weekendAccess ? "Book any day including weekends" : "Mon-Fri booking only"}</li>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
