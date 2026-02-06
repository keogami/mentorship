import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.response;

  const allCoupons = await db
    .select()
    .from(coupons)
    .orderBy(desc(coupons.createdAt));

  return NextResponse.json({ coupons: allCoupons });
}

export async function POST(request: Request) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.response;

  const body = await request.json();
  const { code, sessionsGranted, expiresAt, maxUses } = body;

  if (!code?.trim()) {
    return NextResponse.json(
      { error: "Coupon code is required" },
      { status: 400 }
    );
  }

  if (!Number.isInteger(sessionsGranted) || sessionsGranted < 1) {
    return NextResponse.json(
      { error: "sessionsGranted must be a positive integer" },
      { status: 400 }
    );
  }

  if (maxUses !== undefined && maxUses !== null) {
    if (!Number.isInteger(maxUses) || maxUses < 1) {
      return NextResponse.json(
        { error: "maxUses must be a positive integer" },
        { status: 400 }
      );
    }
  }

  try {
    const [coupon] = await db
      .insert(coupons)
      .values({
        code: code.toUpperCase().trim(),
        sessionsGranted,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxUses: maxUses || null,
        active: false, // Coupons are inactive by default
      })
      .returning();

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (err) {
    // Handle unique constraint violation
    if (
      err instanceof Error &&
      err.message.includes("unique")
    ) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 409 }
      );
    }
    throw err;
  }
}
