import { desc, eq } from "drizzle-orm"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { GoBackButton } from "@/components/layout/go-back-button"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getUserSubscriptionWithPlan } from "@/lib/booking"
import { db } from "@/lib/db"
import { sessions, users } from "@/lib/db/schema"
import { getActivePack } from "@/lib/packs"
import { SessionsClient } from "./sessions-client"

export default async function SessionsPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect("/subscribe")
  }

  // Get user from database
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))

  if (!user) {
    redirect("/subscribe")
  }

  // Get subscription and pack
  const subscription = await getUserSubscriptionWithPlan(user.id)
  const activePack = await getActivePack(user.id)

  // Get user's sessions
  const userSessions = await db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, user.id))
    .orderBy(desc(sessions.scheduledAt))
    .limit(50)

  const formattedSessions = userSessions.map((s) => ({
    id: s.id,
    scheduledAt: s.scheduledAt.toISOString(),
    durationMinutes: s.durationMinutes,
    status: s.status,
    meetLink: s.meetLink,
    cancelledAt: s.cancelledAt?.toISOString() || null,
    lateCancel: s.lateCancel,
    createdAt: s.createdAt.toISOString(),
  }))

  const hasActiveSubscription = subscription?.status === "active"
  const subRemaining = hasActiveSubscription
    ? subscription.plan.sessionsPerPeriod +
      subscription.carryOverSessions -
      subscription.sessionsUsedThisPeriod
    : 0
  const packRemaining = activePack?.sessionsRemaining ?? 0
  const sessionsRemaining = subRemaining + packRemaining
  const hasAnySessions = sessionsRemaining > 0

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-3xl space-y-6">
        <GoBackButton />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="cli-prompt text-3xl font-bold">sessions</h1>
            <p className="text-muted-foreground">
              view and manage your mentorship sessions
            </p>
          </div>
        </div>

        {hasAnySessions ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Balance</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold">{sessionsRemaining}</p>
                <p className="text-sm text-muted-foreground">
                  sessions remaining
                  {hasActiveSubscription && (
                    <>
                      {" "}
                      ({subRemaining} subscription
                      {packRemaining > 0 && <> + {packRemaining} pack</>})
                    </>
                  )}
                  {!hasActiveSubscription && packRemaining > 0 && " (pack)"}
                </p>
              </div>
              <Button asChild>
                <Link href="/book">Book Session</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Active Sessions</CardTitle>
              <CardDescription>
                Subscribe or redeem a coupon to book mentorship sessions
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
  )
}
