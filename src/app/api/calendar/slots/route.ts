import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import {
  generateSlots,
  getUserSubscriptionWithPlan,
  hasPendingSession,
} from "@/lib/booking"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { getActivePack } from "@/lib/packs"

export async function GET() {
  const session = await auth()

  let userId: string | null = null
  let weekendAccess = false
  let userHasPendingSession = false
  let sessionsRemaining = 0
  let hasSessionSource = false
  let hasActivePack = false

  if (session?.user?.email) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))

    if (user) {
      userId = user.id

      const [subscription, activePack] = await Promise.all([
        getUserSubscriptionWithPlan(user.id),
        getActivePack(user.id),
      ])

      if (subscription && subscription.status === "active") {
        hasSessionSource = true
        weekendAccess = subscription.plan.weekendAccess
        sessionsRemaining =
          subscription.plan.sessionsPerPeriod -
          subscription.sessionsUsedThisPeriod
      }

      if (activePack) {
        hasSessionSource = true
        hasActivePack = true
        weekendAccess = true
        sessionsRemaining += activePack.sessionsRemaining
      }

      if (hasSessionSource) {
        userHasPendingSession = await hasPendingSession(user.id)
      }
    }
  }

  const days = await generateSlots(userId, weekendAccess, userHasPendingSession)

  return NextResponse.json({
    days,
    userContext: userId
      ? {
          sessionsRemaining,
          hasPendingSession: userHasPendingSession,
          weekendAccess,
          hasActiveSubscription: hasSessionSource,
          hasActivePack,
        }
      : null,
  })
}
