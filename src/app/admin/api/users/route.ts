import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { users, subscriptions, plans } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.response;

  const results = await db
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
    .orderBy(desc(subscriptions.createdAt));

  // Group by user, taking the most recent subscription
  const userMap = new Map<
    string,
    {
      id: string;
      name: string;
      email: string;
      blocked: boolean;
      createdAt: Date;
      subscription: {
        id: string;
        status: string;
        planName: string;
        planSlug: string;
        priceInr: number;
        period: string;
        sessionsUsed: number;
        sessionsTotal: number;
        currentPeriodEnd: Date;
        cancelledAt: Date | null;
      };
    }
  >();

  for (const row of results) {
    if (!userMap.has(row.userId)) {
      userMap.set(row.userId, {
        id: row.userId,
        name: row.userName,
        email: row.userEmail,
        blocked: row.userBlocked,
        createdAt: row.userCreatedAt,
        subscription: {
          id: row.subscriptionId,
          status: row.subscriptionStatus,
          planName: row.planName,
          planSlug: row.planSlug,
          priceInr: row.priceInr,
          period: row.period,
          sessionsUsed: row.sessionsUsedThisPeriod,
          sessionsTotal: row.sessionsPerPeriod,
          currentPeriodEnd: row.currentPeriodEnd,
          cancelledAt: row.cancelledAt,
        },
      });
    }
  }

  return NextResponse.json({ users: Array.from(userMap.values()) });
}
