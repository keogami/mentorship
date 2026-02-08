import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { plans } from "@/lib/db/schema"

export async function GET() {
  const activePlans = await db
    .select({
      id: plans.id,
      name: plans.name,
      slug: plans.slug,
      priceInr: plans.priceInr,
      sessionsPerPeriod: plans.sessionsPerPeriod,
      period: plans.period,
      weekendAccess: plans.weekendAccess,
      active: plans.active,
      createdAt: plans.createdAt,
    })
    .from(plans)
    .where(eq(plans.active, true))

  return NextResponse.json(activePlans)
}
