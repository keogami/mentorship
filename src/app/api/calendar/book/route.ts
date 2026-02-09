import {
  addDays,
  addMinutes,
  endOfDay,
  format,
  isWeekend,
  startOfDay,
} from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { and, eq, gte, inArray, lte, sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { MENTOR_CONFIG } from "@/lib/constants"
import { checkCsrf } from "@/lib/csrf"
import { db } from "@/lib/db"
import {
  mentorBlocks,
  mentorConfig,
  packs,
  plans,
  sessions,
  subscriptionCredits,
  subscriptions,
  users,
} from "@/lib/db/schema"
import { createCalendarEvent } from "@/lib/google-calendar/client"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { bookSessionSchema, validateBody } from "@/lib/validation"

const IST_TIMEZONE = "Asia/Kolkata"

export async function POST(request: Request) {
  const csrfError = checkCsrf(request)
  if (csrfError) return csrfError

  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    )
  }

  const rateCheck = checkRateLimit(
    `book:${session.user.email}`,
    RATE_LIMITS.book
  )
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    )
  }

  const body = await request.json()
  const parsed = validateBody(bookSessionSchema, body)
  if (!parsed.success) return parsed.response

  const scheduledAt = new Date(parsed.data.scheduledAt)

  // Get user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  if (user.blocked) {
    return NextResponse.json(
      { error: "Your account has been suspended" },
      { status: 403 }
    )
  }

  // Run entire booking flow inside a transaction with row-level locks
  const result = await db.transaction(async (tx) => {
    // Load mentor config
    const [config] = await tx.select().from(mentorConfig).limit(1)
    const cfg = config || MENTOR_CONFIG

    // 1. Lock and load subscription (if any)
    const [subRow] = await tx
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        status: subscriptions.status,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        sessionsUsedThisPeriod: subscriptions.sessionsUsedThisPeriod,
        carryOverSessions: subscriptions.carryOverSessions,
        planId: plans.id,
        planName: plans.name,
        planSlug: plans.slug,
        sessionsPerPeriod: plans.sessionsPerPeriod,
        weekendAccess: plans.weekendAccess,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(
        and(
          eq(subscriptions.userId, user.id),
          eq(subscriptions.status, "active")
        )
      )
      .for("update")
      .limit(1)

    let subscription: {
      id: string
      sessionsUsedThisPeriod: number
      carryOverSessions: number
      currentPeriodEnd: Date
      plan: {
        id: string
        name: string
        slug: string
        sessionsPerPeriod: number
        weekendAccess: boolean
      }
      bonusDays: number
    } | null = null

    if (subRow) {
      const credits = await tx
        .select({ days: subscriptionCredits.days })
        .from(subscriptionCredits)
        .where(eq(subscriptionCredits.subscriptionId, subRow.id))
      const bonusDays = credits.reduce((sum, c) => sum + c.days, 0)

      subscription = {
        id: subRow.id,
        sessionsUsedThisPeriod: subRow.sessionsUsedThisPeriod,
        carryOverSessions: subRow.carryOverSessions,
        currentPeriodEnd: subRow.currentPeriodEnd,
        plan: {
          id: subRow.planId,
          name: subRow.planName,
          slug: subRow.planSlug,
          sessionsPerPeriod: subRow.sessionsPerPeriod,
          weekendAccess: subRow.weekendAccess,
        },
        bonusDays,
      }
    }

    // 2. Lock and load pack (if any)
    const [pack] = await tx
      .select()
      .from(packs)
      .where(
        and(
          eq(packs.userId, user.id),
          sql`${packs.expiresAt} > now()`,
          sql`${packs.sessionsRemaining} > 0`
        )
      )
      .for("update")
      .limit(1)

    // 3. Must have at least one source
    if (!subscription && !pack) {
      return {
        error: "You need an active subscription or session pack to book",
        status: 400,
      }
    }

    // 4. Check subscription effective expiry and compute remaining
    let subRemaining = 0
    if (subscription) {
      const effectiveEnd = addDays(
        subscription.currentPeriodEnd,
        subscription.bonusDays
      )
      if (new Date() <= effectiveEnd) {
        subRemaining =
          subscription.plan.sessionsPerPeriod +
          subscription.carryOverSessions -
          subscription.sessionsUsedThisPeriod
      }
    }
    const packRemaining = pack?.sessionsRemaining ?? 0
    if (subRemaining + packRemaining <= 0) {
      return {
        error: "You have used all your sessions for this period",
        status: 400,
      }
    }

    // 5. Check no pending session (inside transaction)
    const [pending] = await tx
      .select({ id: sessions.id })
      .from(sessions)
      .where(
        and(eq(sessions.userId, user.id), eq(sessions.status, "scheduled"))
      )
      .limit(1)

    if (pending) {
      return {
        error:
          "You already have a scheduled session. Complete or cancel it first.",
        status: 400,
      }
    }

    // 6. Check slot is not in the past
    if (scheduledAt <= new Date()) {
      return { error: "Cannot book a session in the past", status: 400 }
    }

    // 7. Check valid time slot
    const istTime = toZonedTime(scheduledAt, IST_TIMEZONE)
    const hours = istTime.getHours()
    if (!(hours >= 14 && hours <= 18 && istTime.getMinutes() === 0)) {
      return {
        error:
          "Invalid time slot. Sessions are available at 14:00, 15:00, 16:00, 17:00, and 18:00 IST",
        status: 400,
      }
    }

    // 8. Check within booking window
    const now = new Date()
    const minDate = addDays(startOfDay(now), 1)
    const maxDate = addDays(startOfDay(now), cfg.bookingWindowDays + 1)
    if (scheduledAt < minDate || scheduledAt >= maxDate) {
      return {
        error: `You can only book sessions 1-${cfg.bookingWindowDays} days in advance`,
        status: 400,
      }
    }

    // 9. Check weekend access
    const istDate = toZonedTime(scheduledAt, IST_TIMEZONE)
    const weekendAccessAllowed =
      subscription?.plan.weekendAccess || !!pack
    if (isWeekend(istDate) && !weekendAccessAllowed) {
      return {
        error:
          "Your plan does not include weekend booking. Upgrade to Anytime or get a session pack for weekends.",
        status: 400,
      }
    }

    // 10. Check mentor not blocked
    const dateStr = scheduledAt.toISOString().split("T")[0]
    const [block] = await tx
      .select({ id: mentorBlocks.id })
      .from(mentorBlocks)
      .where(
        and(
          lte(mentorBlocks.startDate, dateStr),
          gte(mentorBlocks.endDate, dateStr)
        )
      )
      .limit(1)
    if (block) {
      return { error: "The mentor is unavailable on this date", status: 400 }
    }

    // 11. Check user hasn't already booked this day
    const dayStart = startOfDay(scheduledAt)
    const dayEnd = endOfDay(scheduledAt)
    const [existingBooking] = await tx
      .select({ id: sessions.id })
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, user.id),
          gte(sessions.scheduledAt, dayStart),
          lte(sessions.scheduledAt, dayEnd),
          inArray(sessions.status, ["scheduled", "completed"])
        )
      )
      .limit(1)
    if (existingBooking) {
      return { error: "You can only book one session per day", status: 400 }
    }

    // 12. Check mentor capacity (lock the count)
    const [capacityResult] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(sessions)
      .where(
        and(
          gte(sessions.scheduledAt, dayStart),
          lte(sessions.scheduledAt, dayEnd),
          eq(sessions.status, "scheduled")
        )
      )
    if ((capacityResult?.count ?? 0) >= cfg.maxSessionsPerDay) {
      return { error: "All sessions are booked for this day", status: 400 }
    }

    // 13. Determine debit source
    let debitSource: "subscription" | "pack" = "pack"
    if (subscription && subRemaining > 0) {
      if (!isWeekend(istDate)) {
        debitSource = "subscription"
      } else if (subscription.plan.weekendAccess) {
        debitSource = "subscription"
      }
    }

    // 14. Create session
    const [newSession] = await tx
      .insert(sessions)
      .values({
        userId: user.id,
        subscriptionId:
          debitSource === "subscription" ? subscription!.id : null,
        packId: debitSource === "pack" ? pack!.id : null,
        googleEventId: null,
        meetLink: null,
        scheduledAt,
        durationMinutes: MENTOR_CONFIG.sessionDurationMinutes,
        status: "scheduled",
      })
      .returning()

    // 15. Debit the source atomically
    if (debitSource === "subscription") {
      await tx
        .update(subscriptions)
        .set({
          sessionsUsedThisPeriod: sql`${subscriptions.sessionsUsedThisPeriod} + 1`,
        })
        .where(eq(subscriptions.id, subscription!.id))
    } else {
      await tx
        .update(packs)
        .set({
          sessionsRemaining: sql`${packs.sessionsRemaining} - 1`,
        })
        .where(eq(packs.id, pack!.id))
    }

    return {
      success: true as const,
      session: newSession,
      subscription,
      pack,
      debitSource,
      subRemaining,
      packRemaining,
    }
  })

  // Handle transaction errors
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  // Create Google Calendar event outside the transaction
  const endTime = addMinutes(scheduledAt, MENTOR_CONFIG.sessionDurationMinutes)
  const istTime = toZonedTime(scheduledAt, IST_TIMEZONE)
  const formattedDate = format(istTime, "EEEE, MMMM d, yyyy 'at' h:mm a")

  let googleEventId: string | null = null
  let meetLink: string | null = null
  try {
    const calendarResult = await createCalendarEvent(
      `Mentorship Session - ${user.name}`,
      `50-minute mentorship session with ${user.name} (${user.email})`,
      scheduledAt,
      endTime,
      user.email
    )
    googleEventId = calendarResult.eventId
    meetLink = calendarResult.meetLink

    // Update session with calendar info
    await db
      .update(sessions)
      .set({ googleEventId, meetLink })
      .where(eq(sessions.id, result.session.id))
  } catch (error) {
    console.error("Failed to create calendar event:", error)
  }

  const subRemainingAfter = result.subscription
    ? result.subscription.plan.sessionsPerPeriod +
      result.subscription.carryOverSessions -
      result.subscription.sessionsUsedThisPeriod -
      (result.debitSource === "subscription" ? 1 : 0)
    : 0
  const packRemainingAfter = result.pack
    ? result.pack.sessionsRemaining - (result.debitSource === "pack" ? 1 : 0)
    : 0

  return NextResponse.json({
    session: {
      id: result.session.id,
      scheduledAt: result.session.scheduledAt,
      formattedDate,
      durationMinutes: result.session.durationMinutes,
      status: result.session.status,
      meetLink,
      hasCalendarEvent: !!googleEventId,
    },
    sessionsRemaining: subRemainingAfter + packRemainingAfter,
  })
}
