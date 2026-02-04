import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import {
  mentorBlocks,
  subscriptions,
  subscriptionCredits,
  sessions,
} from "@/lib/db/schema";
import { eq, and, gte, lt, desc } from "drizzle-orm";
import { differenceInCalendarDays, parseISO, addDays } from "date-fns";
import { deleteCalendarEvent } from "@/lib/google-calendar/client";

export async function GET() {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.response;

  const blocks = await db
    .select()
    .from(mentorBlocks)
    .orderBy(desc(mentorBlocks.startDate));

  return NextResponse.json({ blocks });
}

export async function POST(request: Request) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.response;

  const body = await request.json();
  const { startDate, endDate, reason } = body;

  if (!startDate || !endDate || !reason?.trim()) {
    return NextResponse.json(
      { error: "startDate, endDate, and reason are required" },
      { status: 400 }
    );
  }

  const start = parseISO(startDate);
  const end = parseISO(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD." },
      { status: 400 }
    );
  }

  if (end < start) {
    return NextResponse.json(
      { error: "endDate must be on or after startDate" },
      { status: 400 }
    );
  }

  // 1. Create block
  const [block] = await db
    .insert(mentorBlocks)
    .values({
      startDate,
      endDate,
      reason: reason.trim(),
    })
    .returning();

  // 2. Calculate block days (inclusive)
  const blockDays = differenceInCalendarDays(end, start) + 1;

  // 3. Credit each active subscription
  const activeSubs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.status, "active"));

  for (const sub of activeSubs) {
    await db.insert(subscriptionCredits).values({
      subscriptionId: sub.id,
      days: blockDays,
      reason: `Mentor unavailable: ${reason.trim()}`,
      blockId: block.id,
    });
  }

  // 4. Cancel scheduled sessions within the block range
  const blockStart = start; // midnight UTC of start date
  const blockEndExclusive = addDays(end, 1); // midnight UTC of day after end date

  const scheduledSessions = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.status, "scheduled"),
        gte(sessions.scheduledAt, blockStart),
        lt(sessions.scheduledAt, blockEndExclusive)
      )
    );

  const affectedSubscriptionCounts = new Map<string, number>();

  for (const s of scheduledSessions) {
    if (s.googleEventId) {
      try {
        await deleteCalendarEvent(s.googleEventId);
      } catch (err) {
        console.error(`Failed to delete calendar event ${s.googleEventId}:`, err);
      }
    }

    await db
      .update(sessions)
      .set({
        status: "cancelled_by_mentor",
        cancelledAt: new Date(),
      })
      .where(eq(sessions.id, s.id));

    if (s.subscriptionId) {
      affectedSubscriptionCounts.set(
        s.subscriptionId,
        (affectedSubscriptionCounts.get(s.subscriptionId) || 0) + 1
      );
    }
  }

  // 5. Credit session counts back to affected subscriptions
  for (const [subId, count] of affectedSubscriptionCounts) {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subId));

    if (sub) {
      await db
        .update(subscriptions)
        .set({
          sessionsUsedThisPeriod: Math.max(0, sub.sessionsUsedThisPeriod - count),
        })
        .where(eq(subscriptions.id, subId));
    }
  }

  // 6. Mark as notified (email deferred to Phase 7)
  await db
    .update(mentorBlocks)
    .set({ usersNotified: true })
    .where(eq(mentorBlocks.id, block.id));

  return NextResponse.json({
    block: { ...block, usersNotified: true },
    creditedSubscriptions: activeSubs.length,
    daysPerSubscription: blockDays,
    cancelledSessions: scheduledSessions.length,
  });
}
