import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, sessions, subscriptions, packs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  validateBooking,
  getUserBookingContext,
  determineDebitSource,
} from "@/lib/booking";
import { createCalendarEvent } from "@/lib/google-calendar/client";
import { MENTOR_CONFIG } from "@/lib/constants";
import { addMinutes } from "date-fns";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { scheduledAt: scheduledAtStr } = body;

  if (!scheduledAtStr) {
    return NextResponse.json(
      { error: "scheduledAt is required" },
      { status: 400 }
    );
  }

  const scheduledAt = new Date(scheduledAtStr);
  if (Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json(
      { error: "Invalid date format" },
      { status: 400 }
    );
  }

  // Get user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email));

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  if (user.blocked) {
    return NextResponse.json(
      { error: "Your account has been suspended" },
      { status: 403 }
    );
  }

  // Validate booking
  const validation = await validateBooking(user.id, scheduledAt);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.message, code: validation.error },
      { status: 400 }
    );
  }

  // Get booking context to determine debit source
  const { subscription, pack } = await getUserBookingContext(user.id);
  if (!subscription && !pack) {
    return NextResponse.json(
      { error: "No active subscription or session pack found" },
      { status: 400 }
    );
  }

  const debitSource = determineDebitSource(subscription, pack, scheduledAt);

  // Create Google Calendar event with Meet link
  const endTime = addMinutes(scheduledAt, MENTOR_CONFIG.sessionDurationMinutes);
  const istTime = toZonedTime(scheduledAt, "Asia/Kolkata");
  const formattedDate = format(istTime, "EEEE, MMMM d, yyyy 'at' h:mm a");

  let googleEventId: string | null = null;
  let meetLink: string | null = null;
  try {
    const calendarResult = await createCalendarEvent(
      `Mentorship Session - ${user.name}`,
      `50-minute mentorship session with ${user.name} (${user.email})`,
      scheduledAt,
      endTime,
      user.email
    );
    googleEventId = calendarResult.eventId;
    meetLink = calendarResult.meetLink;
  } catch (error) {
    console.error("Failed to create calendar event:", error);
    // Continue without calendar event - can be added later
  }

  // Create session and debit the appropriate source
  const [newSession] = await db
    .insert(sessions)
    .values({
      userId: user.id,
      subscriptionId: debitSource === "subscription" ? subscription!.id : null,
      packId: debitSource === "pack" ? pack!.id : null,
      googleEventId,
      meetLink,
      scheduledAt,
      durationMinutes: MENTOR_CONFIG.sessionDurationMinutes,
      status: "scheduled",
    })
    .returning();

  if (debitSource === "subscription") {
    await db
      .update(subscriptions)
      .set({
        sessionsUsedThisPeriod: subscription!.sessionsUsedThisPeriod + 1,
      })
      .where(eq(subscriptions.id, subscription!.id));
  } else {
    await db
      .update(packs)
      .set({
        sessionsRemaining: pack!.sessionsRemaining - 1,
      })
      .where(eq(packs.id, pack!.id));
  }

  // Calculate total remaining sessions
  const subRemaining = subscription
    ? subscription.plan.sessionsPerPeriod -
      subscription.sessionsUsedThisPeriod -
      (debitSource === "subscription" ? 1 : 0)
    : 0;
  const packRemaining = pack
    ? pack.sessionsRemaining - (debitSource === "pack" ? 1 : 0)
    : 0;

  return NextResponse.json({
    session: {
      id: newSession.id,
      scheduledAt: newSession.scheduledAt,
      formattedDate,
      durationMinutes: newSession.durationMinutes,
      status: newSession.status,
      meetLink: newSession.meetLink,
      hasCalendarEvent: !!googleEventId,
    },
    sessionsRemaining: subRemaining + packRemaining,
  });
}
