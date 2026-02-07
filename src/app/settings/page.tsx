import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, subscriptions, plans } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { GoBackButton } from "@/components/layout/go-back-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SubscriptionSettings } from "./subscription-settings";

export default async function SettingsPage() {
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

  // Get all available plans for plan change
  const availablePlans = await db
    .select()
    .from(plans)
    .where(eq(plans.active, true));

  // Sort plans in order: weekly, monthly, anytime
  const sortedPlans = availablePlans.sort((a, b) => {
    const order = ["weekly_weekday", "monthly_weekday", "anytime"];
    return order.indexOf(a.slug) - order.indexOf(b.slug);
  });

  if (!activeSubscription) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>No Active Subscription</CardTitle>
              <CardDescription>
                You don&apos;t have an active subscription to manage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Subscribe to a plan to start booking mentorship sessions.
              </p>
              <Button asChild>
                <Link href="/subscribe">View Plans</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Get pending plan change info if exists
  let pendingPlan = null;
  if (activeSubscription.subscription.pendingPlanChangeId) {
    const [pending] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, activeSubscription.subscription.pendingPlanChangeId));
    pendingPlan = pending;
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl space-y-6">
        <GoBackButton />

        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your subscription and account
          </p>
        </div>

        <SubscriptionSettings
          subscription={{
            id: activeSubscription.subscription.id,
            userId: activeSubscription.subscription.userId,
            status: activeSubscription.subscription.status,
            currentPeriodStart: activeSubscription.subscription.currentPeriodStart,
            currentPeriodEnd: activeSubscription.subscription.currentPeriodEnd,
            sessionsUsedThisPeriod: activeSubscription.subscription.sessionsUsedThisPeriod,
            planId: activeSubscription.subscription.planId,
            pendingPlanChangeId: activeSubscription.subscription.pendingPlanChangeId,
            cancelledAt: activeSubscription.subscription.cancelledAt,
            cancelReason: activeSubscription.subscription.cancelReason,
            createdAt: activeSubscription.subscription.createdAt,
          }}
          currentPlan={activeSubscription.plan}
          availablePlans={sortedPlans}
          pendingPlan={pendingPlan}
        />
      </div>
    </div>
  );
}
