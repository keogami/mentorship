import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { coupons, couponRedemptions, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const updateCouponSchema = z
  .object({
    code: z
      .string()
      .min(1, "Code cannot be empty")
      .transform((s) => s.trim().toUpperCase())
      .optional(),
    sessionsGranted: z
      .number()
      .int()
      .positive("Sessions granted must be a positive integer")
      .optional(),
    maxUses: z
      .number()
      .int()
      .positive("Max uses must be a positive integer")
      .nullable()
      .optional(),
    expiresAt: z.string().nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.response;

  const { id } = await params;

  // Find coupon
  const [coupon] = await db.select().from(coupons).where(eq(coupons.id, id));
  if (!coupon) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }

  // Get redemption history with user info
  const redemptions = await db
    .select({
      id: couponRedemptions.id,
      redeemedAt: couponRedemptions.redeemedAt,
      userId: couponRedemptions.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(couponRedemptions)
    .innerJoin(users, eq(couponRedemptions.userId, users.id))
    .where(eq(couponRedemptions.couponId, id))
    .orderBy(desc(couponRedemptions.redeemedAt));

  return NextResponse.json({ coupon, redemptions });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.response;

  const { id } = await params;
  const body = await request.json();

  // Validate with Zod
  const parsed = updateCouponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  // Find existing coupon
  const [existing] = await db.select().from(coupons).where(eq(coupons.id, id));
  if (!existing) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }

  // Build update object from validated fields
  const { code, sessionsGranted, maxUses, expiresAt, active } = parsed.data;
  const updates: Partial<typeof coupons.$inferInsert> = {};

  if (code !== undefined) updates.code = code;
  if (sessionsGranted !== undefined) updates.sessionsGranted = sessionsGranted;
  if (maxUses !== undefined) updates.maxUses = maxUses;
  if (expiresAt !== undefined)
    updates.expiresAt = expiresAt ? new Date(expiresAt) : null;
  if (active !== undefined) updates.active = active;

  try {
    const [updated] = await db
      .update(coupons)
      .set(updates)
      .where(eq(coupons.id, id))
      .returning();

    return NextResponse.json({ coupon: updated });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes("unique")
    ) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 409 }
      );
    }
    throw error;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.response;

  const { id } = await params;

  // Check if coupon exists
  const [existing] = await db.select().from(coupons).where(eq(coupons.id, id));
  if (!existing) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }

  // Check if coupon has redemption history
  const [redemption] = await db
    .select({ id: couponRedemptions.id })
    .from(couponRedemptions)
    .where(eq(couponRedemptions.couponId, id))
    .limit(1);

  if (redemption) {
    return NextResponse.json(
      { error: "Cannot delete coupon with redemption history. Deactivate it instead." },
      { status: 400 }
    );
  }

  // Delete coupon
  await db.delete(coupons).where(eq(coupons.id, id));

  return NextResponse.json({ deleted: true });
}
