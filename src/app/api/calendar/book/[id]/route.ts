import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, sessions, subscriptions, packs, mentorConfig } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { differenceInHours } from "date-fns";
import { deleteCalendarEvent } from "@/lib/google-calendar/client";
import { MENTOR_CONFIG } from "@/lib/constants";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const { id: sessionId } = await params;

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

  // Run cancellation in a transaction
  const result = await db.transaction(async (tx) => {
    // Lock the session row
    const [bookingSession] = await tx
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.id, sessionId),
          eq(sessions.userId, user.id)
        )
      )
      .for("update");

    if (!bookingSession) {
      return { error: "Session not found", status: 404 };
    }

    if (bookingSession.status !== "scheduled") {
      return { error: "Only scheduled sessions can be cancelled", status: 400 };
    }

    // Check cancellation policy using DB config
    const [config] = await tx.select().from(mentorConfig).limit(1);
    const noticeHours = config?.cancellationNoticeHours ?? MENTOR_CONFIG.cancellationNoticeHours;
    const hoursUntilSession = differenceInHours(bookingSession.scheduledAt, new Date());
    const canGetCredit = hoursUntilSession >= noticeHours;

    // Update session status
    await tx
      .update(sessions)
      .set({
        status: "cancelled_by_user",
        cancelledAt: new Date(),
        lateCancel: !canGetCredit,
      })
      .where(eq(sessions.id, sessionId));

    // Credit back session if cancelled with sufficient notice (atomic updates)
    if (canGetCredit) {
      if (bookingSession.subscriptionId) {
        await tx
          .update(subscriptions)
          .set({
            sessionsUsedThisPeriod: sql`greatest(${subscriptions.sessionsUsedThisPeriod} - 1, 0)`,
          })
          .where(eq(subscriptions.id, bookingSession.subscriptionId));
      } else if (bookingSession.packId) {
        await tx
          .update(packs)
          .set({
            sessionsRemaining: sql`${packs.sessionsRemaining} + 1`,
          })
          .where(eq(packs.id, bookingSession.packId));
      }
    }

    return {
      success: true as const,
      googleEventId: bookingSession.googleEventId,
      canGetCredit,
    };
  });

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  // Delete Google Calendar event outside transaction
  if (result.googleEventId) {
    try {
      await deleteCalendarEvent(result.googleEventId);
    } catch (error) {
      console.error("Failed to delete calendar event:", error);
    }
  }

  return NextResponse.json({
    lateCancel: !result.canGetCredit,
    sessionCredited: result.canGetCredit,
    message: result.canGetCredit
      ? "Session cancelled successfully. Your session credit has been restored."
      : "Session cancelled. Due to late cancellation, this session was not credited back.",
  });
}
