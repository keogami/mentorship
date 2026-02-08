import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin/auth"
import { MENTOR_CONFIG } from "@/lib/constants"
import { checkCsrf } from "@/lib/csrf"
import { db } from "@/lib/db"
import { mentorConfig } from "@/lib/db/schema"
import { updateConfigSchema, validateBody } from "@/lib/validation"

export async function GET() {
  const adminCheck = await requireAdmin()
  if (!adminCheck.authorized) return adminCheck.response

  const [config] = await db.select().from(mentorConfig).limit(1)

  return NextResponse.json({
    config: config || {
      id: "singleton",
      maxSessionsPerDay: MENTOR_CONFIG.maxSessionsPerDay,
      bookingWindowDays: MENTOR_CONFIG.bookingWindowDays,
      cancellationNoticeHours: MENTOR_CONFIG.cancellationNoticeHours,
      updatedAt: null,
    },
  })
}

export async function PATCH(request: Request) {
  const csrfError = checkCsrf(request)
  if (csrfError) return csrfError

  const adminCheck = await requireAdmin()
  if (!adminCheck.authorized) return adminCheck.response

  const body = await request.json()
  const parsed = validateBody(updateConfigSchema, body)
  if (!parsed.success) return parsed.response
  const updates = parsed.data

  // Upsert the singleton row
  const [existing] = await db.select().from(mentorConfig).limit(1)

  if (existing) {
    const [updated] = await db
      .update(mentorConfig)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(mentorConfig.id, "singleton"))
      .returning()
    return NextResponse.json({ config: updated })
  } else {
    const [created] = await db
      .insert(mentorConfig)
      .values({
        id: "singleton",
        maxSessionsPerDay:
          updates.maxSessionsPerDay ?? MENTOR_CONFIG.maxSessionsPerDay,
        bookingWindowDays:
          updates.bookingWindowDays ?? MENTOR_CONFIG.bookingWindowDays,
        cancellationNoticeHours:
          updates.cancellationNoticeHours ??
          MENTOR_CONFIG.cancellationNoticeHours,
        updatedAt: new Date(),
      })
      .returning()
    return NextResponse.json({ config: created })
  }
}
