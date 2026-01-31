import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  generateSlots,
  getUserSubscriptionWithPlan,
  hasPendingSession,
} from "@/lib/booking";
import { BookingClient } from "./booking-client";

export default async function BookPage() {
  const session = await auth();

  let userId: string | null = null;
  let weekendAccess = false;
  let userHasPendingSession = false;
  let sessionsRemaining = 0;
  let hasActiveSubscription = false;

  if (session?.user?.email) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email));

    if (user) {
      userId = user.id;

      const subscription = await getUserSubscriptionWithPlan(user.id);
      if (subscription && subscription.status === "active") {
        hasActiveSubscription = true;
        weekendAccess = subscription.plan.weekendAccess;
        sessionsRemaining =
          subscription.plan.sessionsPerPeriod -
          subscription.sessionsUsedThisPeriod;
        userHasPendingSession = await hasPendingSession(user.id);
      }
    }
  }

  const days = await generateSlots(userId, weekendAccess, userHasPendingSession);

  const userContext = userId
    ? {
        sessionsRemaining,
        hasPendingSession: userHasPendingSession,
        weekendAccess,
        hasActiveSubscription,
      }
    : null;

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Book a Session</h1>
            <p className="text-muted-foreground">
              Select an available time slot to schedule your mentorship session
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>

        {!session?.user && (
          <Card>
            <CardHeader>
              <CardTitle>Sign in to Book</CardTitle>
              <CardDescription>
                You need an active subscription to book sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Browse available time slots below. Sign in with an active subscription to book.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/subscribe">Get Started</Link>
              </Button>
            </CardFooter>
          </Card>
        )}

        {session?.user && !hasActiveSubscription && (
          <Card>
            <CardHeader>
              <CardTitle>Subscribe to Book</CardTitle>
              <CardDescription>
                You need an active subscription to book sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Choose a plan that fits your schedule to start booking mentorship sessions.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/subscribe">View Plans</Link>
              </Button>
            </CardFooter>
          </Card>
        )}

        {userHasPendingSession && (
          <Card className="border-amber-500 bg-amber-500/10">
            <CardHeader>
              <CardTitle className="text-amber-700 dark:text-amber-400">
                Pending Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-700 dark:text-amber-400">
                You already have a scheduled session. Complete or cancel it before booking another.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link href="/sessions">View Sessions</Link>
              </Button>
            </CardFooter>
          </Card>
        )}

        {sessionsRemaining <= 0 && hasActiveSubscription && (
          <Card className="border-amber-500 bg-amber-500/10">
            <CardHeader>
              <CardTitle className="text-amber-700 dark:text-amber-400">
                No Sessions Remaining
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-700 dark:text-amber-400">
                You&apos;ve used all your sessions for this billing period. Your sessions will reset at the start of your next billing cycle.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="p-0">
            <BookingClient initialDays={days} userContext={userContext} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Booking Info</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Session Duration:</strong> 50 minutes
            </p>
            <p>
              <strong>Booking Window:</strong> You can book sessions 1-7 days in advance
            </p>
            <p>
              <strong>Cancellation Policy:</strong> Cancel at least 4 hours before your session to receive a credit back. Late cancellations will not be credited.
            </p>
            <p>
              <strong>One at a Time:</strong> You can only have one scheduled session at a time. Complete or cancel your current session to book another.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
