import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, coupons, couponRedemptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createOrAddToPack } from "@/lib/packs";
import { validateBody, redeemSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = validateBody(redeemSchema, body);
  if (!parsed.success) return parsed.response;

  const { code } = parsed.data;

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

  // Find coupon (code is already normalized by schema)
  const allCoupons = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code));

  const coupon = allCoupons[0];

  if (!coupon) {
    return NextResponse.json(
      { error: "Coupon not found" },
      { status: 404 }
    );
  }

  if (!coupon.active) {
    return NextResponse.json(
      { error: "Coupon is inactive" },
      { status: 400 }
    );
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Coupon has expired" },
      { status: 400 }
    );
  }

  if (coupon.maxUses !== null && coupon.uses >= coupon.maxUses) {
    return NextResponse.json(
      { error: "Coupon has reached maximum redemptions" },
      { status: 400 }
    );
  }

  // Check if user has already redeemed this coupon
  const [existingRedemption] = await db
    .select()
    .from(couponRedemptions)
    .where(
      and(
        eq(couponRedemptions.couponId, coupon.id),
        eq(couponRedemptions.userId, user.id)
      )
    )
    .limit(1);

  if (existingRedemption) {
    return NextResponse.json(
      { error: "You have already redeemed this coupon" },
      { status: 400 }
    );
  }

  // Create or add to pack
  const pack = await createOrAddToPack(user.id, coupon.sessionsGranted);

  // Record the redemption and increment coupon uses
  await db.insert(couponRedemptions).values({
    couponId: coupon.id,
    userId: user.id,
  });

  await db
    .update(coupons)
    .set({ uses: coupon.uses + 1 })
    .where(eq(coupons.id, coupon.id));

  return NextResponse.json({
    pack: {
      sessionsTotal: pack.sessionsTotal,
      sessionsRemaining: pack.sessionsRemaining,
      expiresAt: pack.expiresAt,
    },
    sessionsAdded: coupon.sessionsGranted,
  });
}
