import { addMonths, startOfMonth } from "date-fns"
import { and, eq, gt, sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { couponRedemptions, coupons, packs, users } from "@/lib/db/schema"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { redeemSchema, validateBody } from "@/lib/validation"

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    )
  }

  // Rate limit coupon redemption (strictest — prevents brute-force)
  const rateCheck = checkRateLimit(
    `redeem:${session.user.email}`,
    RATE_LIMITS.redeem
  )
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    )
  }

  const body = await request.json()
  const parsed = validateBody(redeemSchema, body)
  if (!parsed.success) return parsed.response

  const { code } = parsed.data

  // Get user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  if (user.blocked) {
    return NextResponse.json(
      { error: "Your account has been suspended" },
      { status: 403 }
    )
  }

  // Run entire redemption in a transaction with row-level locks
  const result = await db.transaction(async (tx) => {
    // Lock the coupon row
    const [coupon] = await tx
      .select()
      .from(coupons)
      .where(eq(coupons.code, code))
      .for("update")

    if (!coupon) {
      return { error: "Coupon not found", status: 404 }
    }

    if (!coupon.active) {
      return { error: "Coupon is inactive", status: 400 }
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return { error: "Coupon has expired", status: 400 }
    }

    if (coupon.maxUses !== null && coupon.uses >= coupon.maxUses) {
      return { error: "Coupon has reached maximum redemptions", status: 400 }
    }

    // Check if user has already redeemed this coupon (inside transaction)
    const [existingRedemption] = await tx
      .select()
      .from(couponRedemptions)
      .where(
        and(
          eq(couponRedemptions.couponId, coupon.id),
          eq(couponRedemptions.userId, user.id)
        )
      )
      .limit(1)

    if (existingRedemption) {
      return { error: "You have already redeemed this coupon", status: 400 }
    }

    // Create or add to pack (C4 fix — inside same transaction with FOR UPDATE)
    const [existing] = await tx
      .select()
      .from(packs)
      .where(and(eq(packs.userId, user.id), gt(packs.expiresAt, new Date())))
      .for("update")
      .limit(1)

    let pack
    if (existing) {
      ;[pack] = await tx
        .update(packs)
        .set({
          sessionsTotal: sql`${packs.sessionsTotal} + ${coupon.sessionsGranted}`,
          sessionsRemaining: sql`${packs.sessionsRemaining} + ${coupon.sessionsGranted}`,
        })
        .where(eq(packs.id, existing.id))
        .returning()
    } else {
      const expiresAt = startOfMonth(addMonths(new Date(), 1))
      ;[pack] = await tx
        .insert(packs)
        .values({
          userId: user.id,
          sessionsTotal: coupon.sessionsGranted,
          sessionsRemaining: coupon.sessionsGranted,
          expiresAt,
        })
        .returning()
    }

    // Record the redemption and increment coupon uses atomically
    await tx.insert(couponRedemptions).values({
      couponId: coupon.id,
      userId: user.id,
    })

    // Atomic increment — also serves as a guard with WHERE uses < max_uses
    const updateConditions =
      coupon.maxUses !== null
        ? and(
            eq(coupons.id, coupon.id),
            sql`${coupons.uses} < ${coupon.maxUses}`
          )
        : eq(coupons.id, coupon.id)

    await tx
      .update(coupons)
      .set({ uses: sql`${coupons.uses} + 1` })
      .where(updateConditions)

    return {
      success: true as const,
      pack,
      sessionsGranted: coupon.sessionsGranted,
    }
  })

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({
    pack: {
      sessionsTotal: result.pack.sessionsTotal,
      sessionsRemaining: result.pack.sessionsRemaining,
      expiresAt: result.pack.expiresAt,
    },
    sessionsAdded: result.sessionsGranted,
  })
}
