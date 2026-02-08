import { addDays, differenceInCalendarDays, parseISO } from "date-fns"
import { and, desc, eq, gte, lt, lte, sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin/auth"
import { db } from "@/lib/db"
import {
  mentorBlocks,
  packs,
  sessions,
  subscriptionCredits,
  subscriptions,
  users,
} from "@/lib/db/schema"
import { mentorBlockNoticeEmail, sendBulkEmails } from "@/lib/email"
import { deleteCalendarEvent } from "@/lib/google-calendar/client"
import { createBlockSchema, validateBody } from "@/lib/validation"

export async function GET() {
  const adminCheck = await requireAdmin()
  if (!adminCheck.authorized) return adminCheck.response

  const blocks = await db
    .select()
    .from(mentorBlocks)
    .orderBy(desc(mentorBlocks.startDate))

  return NextResponse.json({ blocks })
}

export async function POST(request: Request) {
  const adminCheck = await requireAdmin()
  if (!adminCheck.authorized) return adminCheck.response

  const body = await request.json()
  const parsed = validateBody(createBlockSchema, body)
  if (!parsed.success) return parsed.response

  const { startDate, endDate, reason } = parsed.data

  const start = parseISO(startDate)
  const end = parseISO(endDate)

  if (end < start) {
    return NextResponse.json(
      { error: "endDate must be on or after startDate" },
      { status: 400 }
    )
  }

  // Wrap all DB mutations in a single transaction
  const result = await db.transaction(async (tx) => {
    // Check for overlapping blocks
    const overlapping = await tx
      .select({ id: mentorBlocks.id })
      .from(mentorBlocks)
      .where(
        and(
          lte(mentorBlocks.startDate, endDate),
          gte(mentorBlocks.endDate, startDate)
        )
      )
      .limit(1)

    if (overlapping.length > 0) {
      return {
        error: "This range overlaps with an existing block",
        status: 409,
      }
    }

    // 1. Create block
    const [block] = await tx
      .insert(mentorBlocks)
      .values({
        startDate,
        endDate,
        reason,
      })
      .returning()

    // 2. Calculate block days (inclusive)
    const blockDays = differenceInCalendarDays(end, start) + 1

    // 3. Credit each active subscription
    const activeSubs = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.status, "active"))

    for (const sub of activeSubs) {
      await tx.insert(subscriptionCredits).values({
        subscriptionId: sub.id,
        days: blockDays,
        reason: `Mentor unavailable: ${reason}`,
        blockId: block.id,
      })
    }

    // 4. Cancel scheduled sessions within the block range
    const blockStart = start
    const blockEndExclusive = addDays(end, 1)

    const scheduledSessions = await tx
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.status, "scheduled"),
          gte(sessions.scheduledAt, blockStart),
          lt(sessions.scheduledAt, blockEndExclusive)
        )
      )

    const calendarEventsToDelete: string[] = []
    const affectedSubscriptionCounts = new Map<string, number>()
    const affectedPackCounts = new Map<string, number>()

    for (const s of scheduledSessions) {
      if (s.googleEventId) {
        calendarEventsToDelete.push(s.googleEventId)
      }

      await tx
        .update(sessions)
        .set({
          status: "cancelled_by_mentor",
          cancelledAt: new Date(),
        })
        .where(eq(sessions.id, s.id))

      if (s.subscriptionId) {
        affectedSubscriptionCounts.set(
          s.subscriptionId,
          (affectedSubscriptionCounts.get(s.subscriptionId) || 0) + 1
        )
      }

      if (s.packId) {
        affectedPackCounts.set(
          s.packId,
          (affectedPackCounts.get(s.packId) || 0) + 1
        )
      }
    }

    // 5. Credit session counts back atomically
    for (const [subId, count] of affectedSubscriptionCounts) {
      await tx
        .update(subscriptions)
        .set({
          sessionsUsedThisPeriod: sql`greatest(${subscriptions.sessionsUsedThisPeriod} - ${count}, 0)`,
        })
        .where(eq(subscriptions.id, subId))
    }

    for (const [packId, count] of affectedPackCounts) {
      await tx
        .update(packs)
        .set({
          sessionsRemaining: sql`${packs.sessionsRemaining} + ${count}`,
        })
        .where(eq(packs.id, packId))
    }

    return {
      success: true as const,
      block,
      blockDays,
      activeSubs,
      scheduledSessionCount: scheduledSessions.length,
      calendarEventsToDelete,
    }
  })

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  // Delete calendar events outside the transaction
  for (const eventId of result.calendarEventsToDelete) {
    try {
      await deleteCalendarEvent(eventId)
    } catch (err) {
      console.error(`Failed to delete calendar event ${eventId}:`, err)
    }
  }

  // Send notification emails outside the transaction
  try {
    const emailMessages = await Promise.all(
      result.activeSubs.map(async (sub) => {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, sub.userId))

        if (!user) return null

        const emailContent = mentorBlockNoticeEmail({
          userName: user.name,
          startDate: start,
          endDate: end,
          reason,
          bonusDays: result.blockDays,
        })

        return {
          to: user.email,
          ...emailContent,
        }
      })
    )

    const validMessages = emailMessages.filter(
      (msg): msg is NonNullable<typeof msg> => msg !== null
    )

    if (validMessages.length > 0) {
      await sendBulkEmails(validMessages)
    }
  } catch (err) {
    console.error("Failed to send block notification emails:", err)
  }

  // Mark as notified
  await db
    .update(mentorBlocks)
    .set({ usersNotified: true })
    .where(eq(mentorBlocks.id, result.block.id))

  return NextResponse.json({
    block: { ...result.block, usersNotified: true },
    creditedSubscriptions: result.activeSubs.length,
    daysPerSubscription: result.blockDays,
    cancelledSessions: result.scheduledSessionCount,
  })
}
