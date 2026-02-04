import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { mentorConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { MENTOR_CONFIG } from "@/lib/constants";

export async function GET() {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.response;

  const [config] = await db.select().from(mentorConfig).limit(1);

  return NextResponse.json({
    config: config || {
      id: "singleton",
      maxSessionsPerDay: MENTOR_CONFIG.maxSessionsPerDay,
      bookingWindowDays: MENTOR_CONFIG.bookingWindowDays,
      cancellationNoticeHours: MENTOR_CONFIG.cancellationNoticeHours,
      updatedAt: null,
    },
  });
}

export async function PATCH(request: Request) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.response;

  const body = await request.json();
  const { maxSessionsPerDay, bookingWindowDays, cancellationNoticeHours } =
    body;

  // Validate: all provided values must be positive integers
  const updates: Record<string, number> = {};
  if (maxSessionsPerDay !== undefined) {
    if (!Number.isInteger(maxSessionsPerDay) || maxSessionsPerDay < 1) {
      return NextResponse.json(
        { error: "maxSessionsPerDay must be a positive integer" },
        { status: 400 }
      );
    }
    updates.maxSessionsPerDay = maxSessionsPerDay;
  }
  if (bookingWindowDays !== undefined) {
    if (!Number.isInteger(bookingWindowDays) || bookingWindowDays < 1) {
      return NextResponse.json(
        { error: "bookingWindowDays must be a positive integer" },
        { status: 400 }
      );
    }
    updates.bookingWindowDays = bookingWindowDays;
  }
  if (cancellationNoticeHours !== undefined) {
    if (
      !Number.isInteger(cancellationNoticeHours) ||
      cancellationNoticeHours < 0
    ) {
      return NextResponse.json(
        { error: "cancellationNoticeHours must be a non-negative integer" },
        { status: 400 }
      );
    }
    updates.cancellationNoticeHours = cancellationNoticeHours;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  // Upsert the singleton row
  const [existing] = await db.select().from(mentorConfig).limit(1);

  if (existing) {
    const [updated] = await db
      .update(mentorConfig)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(mentorConfig.id, "singleton"))
      .returning();
    return NextResponse.json({ config: updated });
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
      .returning();
    return NextResponse.json({ config: created });
  }
}
