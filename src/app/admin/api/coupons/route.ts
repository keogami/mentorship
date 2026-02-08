import { desc } from "drizzle-orm"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin/auth"
import { checkCsrf } from "@/lib/csrf"
import { db } from "@/lib/db"
import { coupons } from "@/lib/db/schema"
import { createCouponSchema, validateBody } from "@/lib/validation"

export async function GET() {
  const adminCheck = await requireAdmin()
  if (!adminCheck.authorized) return adminCheck.response

  const allCoupons = await db
    .select()
    .from(coupons)
    .orderBy(desc(coupons.createdAt))

  return NextResponse.json({ coupons: allCoupons })
}

export async function POST(request: Request) {
  const csrfError = checkCsrf(request)
  if (csrfError) return csrfError

  const adminCheck = await requireAdmin()
  if (!adminCheck.authorized) return adminCheck.response

  const body = await request.json()
  const parsed = validateBody(createCouponSchema, body)
  if (!parsed.success) return parsed.response

  const { code, sessionsGranted, expiresAt, maxUses } = parsed.data

  try {
    const [coupon] = await db
      .insert(coupons)
      .values({
        code,
        sessionsGranted,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxUses: maxUses ?? null,
        active: false, // Coupons are inactive by default
      })
      .returning()

    return NextResponse.json({ coupon }, { status: 201 })
  } catch (err) {
    // Handle unique constraint violation
    if (err instanceof Error && err.message.includes("unique")) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 409 }
      )
    }
    throw err
  }
}
