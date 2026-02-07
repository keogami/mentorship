import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");

  const parsedLimit = limitParam ? parseInt(limitParam, 10) : NaN;
  const parsedOffset = offsetParam ? parseInt(offsetParam, 10) : NaN;
  const limit = Number.isNaN(parsedLimit) ? 20 : Math.min(Math.max(parsedLimit, 1), 50);
  const offset = Number.isNaN(parsedOffset) ? 0 : Math.max(parsedOffset, 0);

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

  // Build query conditions
  const conditions = [eq(sessions.userId, user.id)];

  if (statusFilter) {
    const statuses = statusFilter.split(",");
    const validStatuses = [
      "scheduled",
      "completed",
      "cancelled_by_user",
      "cancelled_by_mentor",
      "no_show",
    ] as const;
    type SessionStatus = (typeof validStatuses)[number];
    const filteredStatuses = statuses.filter((s): s is SessionStatus =>
      (validStatuses as readonly string[]).includes(s)
    );
    if (filteredStatuses.length > 0) {
      conditions.push(inArray(sessions.status, filteredStatuses));
    }
  }

  // Get sessions
  const userSessions = await db
    .select()
    .from(sessions)
    .where(and(...conditions))
    .orderBy(desc(sessions.scheduledAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({
    sessions: userSessions.map((s) => ({
      id: s.id,
      scheduledAt: s.scheduledAt,
      durationMinutes: s.durationMinutes,
      status: s.status,
      meetLink: s.meetLink,
      cancelledAt: s.cancelledAt,
      lateCancel: s.lateCancel,
      createdAt: s.createdAt,
    })),
    pagination: {
      limit,
      offset,
      hasMore: userSessions.length === limit,
    },
  });
}
