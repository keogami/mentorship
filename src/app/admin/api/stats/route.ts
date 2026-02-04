import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { sessions, subscriptions, users, mentorBlocks } from "@/lib/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";

export async function GET() {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.response;

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const todayStr = now.toISOString().split("T")[0];

  const [
    todaySessions,
    [activeSubResult],
    [weekSessionResult],
    [allTimeSessionResult],
    activeBlocks,
  ] = await Promise.all([
    // Today's sessions with user info
    db
      .select({
        id: sessions.id,
        scheduledAt: sessions.scheduledAt,
        status: sessions.status,
        meetLink: sessions.meetLink,
        durationMinutes: sessions.durationMinutes,
        userName: users.name,
        userEmail: users.email,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(
          gte(sessions.scheduledAt, todayStart),
          lte(sessions.scheduledAt, todayEnd)
        )
      )
      .orderBy(sessions.scheduledAt),

    // Active subscriber count
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active")),

    // Sessions this week
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(sessions)
      .where(
        and(
          gte(sessions.scheduledAt, weekStart),
          lte(sessions.scheduledAt, weekEnd)
        )
      ),

    // Total sessions all time
    db.select({ count: sql<number>`count(*)::int` }).from(sessions),

    // Active blocks (end date >= today)
    db
      .select()
      .from(mentorBlocks)
      .where(gte(mentorBlocks.endDate, todayStr)),
  ]);

  return NextResponse.json({
    todaySessions: todaySessions.map((s) => ({
      id: s.id,
      scheduledAt: s.scheduledAt,
      status: s.status,
      meetLink: s.meetLink,
      durationMinutes: s.durationMinutes,
      user: { name: s.userName, email: s.userEmail },
    })),
    stats: {
      activeSubscribers: activeSubResult?.count ?? 0,
      sessionsToday: todaySessions.length,
      sessionsThisWeek: weekSessionResult?.count ?? 0,
      totalSessionsAllTime: allTimeSessionResult?.count ?? 0,
    },
    activeBlocks,
  });
}
