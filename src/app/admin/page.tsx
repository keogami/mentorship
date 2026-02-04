import { db } from "@/lib/db";
import {
  sessions,
  subscriptions,
  plans,
  users,
  mentorBlocks,
  mentorConfig,
  coupons,
} from "@/lib/db/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";
import { MENTOR_CONFIG } from "@/lib/constants";
import { AdminClient } from "./admin-client";

export default async function AdminPage() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const todayStr = now.toISOString().split("T")[0];

  const [
    todaySessions,
    [activeSubResult],
    [weekSessionResult],
    [allTimeSessionResult],
    activeBlocks,
    allBlocks,
    allUsers,
    allCoupons,
    [configRow],
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

    // All blocks
    db
      .select()
      .from(mentorBlocks)
      .orderBy(desc(mentorBlocks.startDate)),

    // All users with subscriptions
    db
      .select({
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        userBlocked: users.blocked,
        userCreatedAt: users.createdAt,
        subscriptionId: subscriptions.id,
        subscriptionStatus: subscriptions.status,
        sessionsUsedThisPeriod: subscriptions.sessionsUsedThisPeriod,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        cancelledAt: subscriptions.cancelledAt,
        planName: plans.name,
        planSlug: plans.slug,
        priceInr: plans.priceInr,
        period: plans.period,
        sessionsPerPeriod: plans.sessionsPerPeriod,
      })
      .from(users)
      .innerJoin(subscriptions, eq(users.id, subscriptions.userId))
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .orderBy(desc(subscriptions.createdAt)),

    // All coupons
    db.select().from(coupons).orderBy(desc(coupons.createdAt)),

    // Mentor config
    db.select().from(mentorConfig).limit(1),
  ]);

  // Group users by most recent subscription, serialize dates for client
  const seenUserIds = new Set<string>();
  const serializedUsers = allUsers.reduce<
    Array<{
      id: string;
      name: string;
      email: string;
      blocked: boolean;
      createdAt: string;
      subscription: {
        id: string;
        status: string;
        planName: string;
        planSlug: string;
        priceInr: number;
        period: string;
        sessionsUsed: number;
        sessionsTotal: number;
        currentPeriodEnd: string;
        cancelledAt: string | null;
      };
    }>
  >((acc, row) => {
    if (!seenUserIds.has(row.userId)) {
      seenUserIds.add(row.userId);
      acc.push({
        id: row.userId,
        name: row.userName,
        email: row.userEmail,
        blocked: row.userBlocked,
        createdAt: row.userCreatedAt.toISOString(),
        subscription: {
          id: row.subscriptionId,
          status: row.subscriptionStatus,
          planName: row.planName,
          planSlug: row.planSlug,
          priceInr: row.priceInr,
          period: row.period,
          sessionsUsed: row.sessionsUsedThisPeriod,
          sessionsTotal: row.sessionsPerPeriod,
          currentPeriodEnd: row.currentPeriodEnd.toISOString(),
          cancelledAt: row.cancelledAt?.toISOString() ?? null,
        },
      });
    }
    return acc;
  }, []);

  const config = configRow || {
    maxSessionsPerDay: MENTOR_CONFIG.maxSessionsPerDay,
    bookingWindowDays: MENTOR_CONFIG.bookingWindowDays,
    cancellationNoticeHours: MENTOR_CONFIG.cancellationNoticeHours,
    updatedAt: null,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mentor Admin</h1>
          <p className="text-muted-foreground">
            Manage your mentorship sessions, subscribers, and settings.
          </p>
        </div>

        <AdminClient
          todaySessions={todaySessions.map((s) => ({
            id: s.id,
            scheduledAt: s.scheduledAt.toISOString(),
            status: s.status,
            meetLink: s.meetLink,
            durationMinutes: s.durationMinutes,
            user: { name: s.userName, email: s.userEmail },
          }))}
          stats={{
            activeSubscribers: activeSubResult?.count ?? 0,
            sessionsToday: todaySessions.length,
            sessionsThisWeek: weekSessionResult?.count ?? 0,
            totalSessionsAllTime: allTimeSessionResult?.count ?? 0,
          }}
          activeBlocks={activeBlocks.map((b) => ({
            id: b.id,
            startDate: b.startDate,
            endDate: b.endDate,
            reason: b.reason,
          }))}
          blocks={allBlocks.map((b) => ({
            id: b.id,
            startDate: b.startDate,
            endDate: b.endDate,
            reason: b.reason,
            usersNotified: b.usersNotified,
            createdAt: b.createdAt.toISOString(),
          }))}
          users={serializedUsers}
          coupons={allCoupons.map((c) => ({
            id: c.id,
            code: c.code,
            sessionsGranted: c.sessionsGranted,
            expiresAt: c.expiresAt?.toISOString() ?? null,
            maxUses: c.maxUses,
            uses: c.uses,
            active: c.active,
            createdAt: c.createdAt.toISOString(),
          }))}
          config={{
            maxSessionsPerDay: config.maxSessionsPerDay,
            bookingWindowDays: config.bookingWindowDays,
            cancellationNoticeHours: config.cancellationNoticeHours,
            updatedAt:
              config.updatedAt instanceof Date
                ? config.updatedAt.toISOString()
                : config.updatedAt,
          }}
        />
      </div>
    </div>
  );
}
