import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, sessions, subscriptions, packs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { canCancelWithCredit } from "@/lib/booking";
import { deleteCalendarEvent } from "@/lib/google-calendar/client";

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

  // Get the session
  const [bookingSession] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.id, sessionId),
        eq(sessions.userId, user.id)
      )
    );

  if (!bookingSession) {
    return NextResponse.json(
      { error: "Session not found" },
      { status: 404 }
    );
  }

  if (bookingSession.status !== "scheduled") {
    return NextResponse.json(
      { error: "Only scheduled sessions can be cancelled" },
      { status: 400 }
    );
  }

  // Check cancellation policy
  const canGetCredit = canCancelWithCredit(bookingSession.scheduledAt);

  // Delete Google Calendar event if exists
  if (bookingSession.googleEventId) {
    try {
      await deleteCalendarEvent(bookingSession.googleEventId);
    } catch (error) {
      console.error("Failed to delete calendar event:", error);
      // Continue with cancellation even if calendar delete fails
    }
  }

  // Update session status
  await db
    .update(sessions)
    .set({
      status: "cancelled_by_user",
      cancelledAt: new Date(),
      lateCancel: !canGetCredit,
    })
    .where(eq(sessions.id, sessionId));

  // Credit back session if cancelled with sufficient notice
  if (canGetCredit) {
    if (bookingSession.subscriptionId) {
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.id, bookingSession.subscriptionId));

      if (subscription && subscription.sessionsUsedThisPeriod > 0) {
        await db
          .update(subscriptions)
          .set({
            sessionsUsedThisPeriod: subscription.sessionsUsedThisPeriod - 1,
          })
          .where(eq(subscriptions.id, subscription.id));
      }
    } else if (bookingSession.packId) {
      const [pack] = await db
        .select()
        .from(packs)
        .where(eq(packs.id, bookingSession.packId));

      if (pack) {
        await db
          .update(packs)
          .set({
            sessionsRemaining: pack.sessionsRemaining + 1,
          })
          .where(eq(packs.id, pack.id));
      }
    }
  }

  return NextResponse.json({
    lateCancel: !canGetCredit,
    sessionCredited: canGetCredit,
    message: canGetCredit
      ? "Session cancelled successfully. Your session credit has been restored."
      : "Session cancelled. Due to late cancellation (less than 4 hours notice), this session was not credited back.",
  });
}
