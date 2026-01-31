import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUserSubscriptionWithPlan } from "@/lib/booking";
import { SessionsClient } from "./sessions-client";

export default async function SessionsPage() {
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

  // Get subscription
  const subscription = await getUserSubscriptionWithPlan(user.id);

  // Get user's sessions
  const userSessions = await db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, user.id))
    .orderBy(desc(sessions.scheduledAt))
    .limit(50);

  const formattedSessions = userSessions.map((s) => ({
    id: s.id,
    scheduledAt: s.scheduledAt.toISOString(),
    durationMinutes: s.durationMinutes,
    status: s.status,
    meetLink: s.meetLink,
    cancelledAt: s.cancelledAt?.toISOString() || null,
    lateCancel: s.lateCancel,
    createdAt: s.createdAt.toISOString(),
  }));

  const hasActiveSubscription = subscription?.status === "active";
  const sessionsRemaining = hasActiveSubscription
    ? subscription.plan.sessionsPerPeriod - subscription.sessionsUsedThisPeriod
    : 0;

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sessions</h1>
            <p className="text-muted-foreground">
              View and manage your mentorship sessions
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>

        {hasActiveSubscription && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Balance</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{sessionsRemaining}</p>
                <p className="text-sm text-muted-foreground">
                  sessions remaining this {subscription.plan.slug.includes("weekly") ? "week" : "month"}
                </p>
              </div>
              <Button asChild disabled={sessionsRemaining <= 0}>
                <Link href="/book">Book Session</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!hasActiveSubscription && (
          <Card>
            <CardHeader>
              <CardTitle>No Active Subscription</CardTitle>
              <CardDescription>
                Subscribe to book mentorship sessions
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild>
                <Link href="/subscribe">View Plans</Link>
              </Button>
            </CardFooter>
          </Card>
        )}

        <SessionsClient initialSessions={formattedSessions} />
      </div>
    </div>
  );
}
