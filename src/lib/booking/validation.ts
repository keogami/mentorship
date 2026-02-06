import { db } from "@/lib/db";
import { sessions, subscriptions, plans, mentorConfig, mentorBlocks, subscriptionCredits } from "@/lib/db/schema";
import { eq, and, gte, lte, sql, inArray } from "drizzle-orm";
import { startOfDay, endOfDay, addDays, isWeekend, differenceInHours } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { MENTOR_CONFIG } from "@/lib/constants";
import { getActivePack } from "@/lib/packs";
import type { Pack } from "@/lib/db/types";

const IST_TIMEZONE = "Asia/Kolkata";

export type BookingError =
  | "no_session_source"
  | "subscription_not_active"
  | "subscription_expired"
  | "no_sessions_remaining"
  | "has_pending_session"
  | "already_booked_today"
  | "mentor_at_capacity"
  | "slot_in_past"
  | "outside_booking_window"
  | "weekend_not_allowed"
  | "mentor_blocked"
  | "invalid_time_slot";

export type UserBookingContext = {
  subscription: SubscriptionWithPlan | null;
  pack: Pack | null;
};

export type BookingValidationResult =
  | { valid: true }
  | { valid: false; error: BookingError; message: string };

export type SubscriptionWithPlan = {
  id: string;
  userId: string;
  status: "pending" | "active" | "cancelled" | "past_due";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  sessionsUsedThisPeriod: number;
  plan: {
    id: string;
    name: string;
    slug: "weekly_weekday" | "monthly_weekday" | "anytime";
    sessionsPerPeriod: number;
    weekendAccess: boolean;
  };
  bonusDays: number;
};

export async function getMentorConfig() {
  const [config] = await db
    .select()
    .from(mentorConfig)
    .limit(1);

  return config || MENTOR_CONFIG;
}

export async function getUserSubscriptionWithPlan(
  userId: string
): Promise<SubscriptionWithPlan | null> {
  const [result] = await db
    .select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      status: subscriptions.status,
      currentPeriodStart: subscriptions.currentPeriodStart,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      sessionsUsedThisPeriod: subscriptions.sessionsUsedThisPeriod,
      planId: plans.id,
      planName: plans.name,
      planSlug: plans.slug,
      sessionsPerPeriod: plans.sessionsPerPeriod,
      weekendAccess: plans.weekendAccess,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active")
      )
    )
    .limit(1);

  if (!result) {
    return null;
  }

  // Get bonus days from subscription credits
  const credits = await db
    .select({ days: subscriptionCredits.days })
    .from(subscriptionCredits)
    .where(eq(subscriptionCredits.subscriptionId, result.id));

  const bonusDays = credits.reduce((sum, c) => sum + c.days, 0);

  return {
    id: result.id,
    userId: result.userId,
    status: result.status,
    currentPeriodStart: result.currentPeriodStart,
    currentPeriodEnd: result.currentPeriodEnd,
    sessionsUsedThisPeriod: result.sessionsUsedThisPeriod,
    plan: {
      id: result.planId,
      name: result.planName,
      slug: result.planSlug,
      sessionsPerPeriod: result.sessionsPerPeriod,
      weekendAccess: result.weekendAccess,
    },
    bonusDays,
  };
}

export async function hasPendingSession(userId: string): Promise<boolean> {
  const [pending] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        eq(sessions.status, "scheduled")
      )
    )
    .limit(1);

  return !!pending;
}

export async function hasBookedOnDate(userId: string, date: Date): Promise<boolean> {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const [existing] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        gte(sessions.scheduledAt, dayStart),
        lte(sessions.scheduledAt, dayEnd),
        inArray(sessions.status, ["scheduled", "completed"])
      )
    )
    .limit(1);

  return !!existing;
}

export async function getMentorSessionCountOnDate(date: Date): Promise<number> {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sessions)
    .where(
      and(
        gte(sessions.scheduledAt, dayStart),
        lte(sessions.scheduledAt, dayEnd),
        eq(sessions.status, "scheduled")
      )
    );

  return result?.count || 0;
}

export async function getMentorBlocks(startDate: Date, endDate: Date) {
  return db
    .select()
    .from(mentorBlocks)
    .where(
      and(
        lte(mentorBlocks.startDate, endDate.toISOString().split("T")[0]),
        gte(mentorBlocks.endDate, startDate.toISOString().split("T")[0])
      )
    );
}

export async function isDateBlocked(date: Date): Promise<boolean> {
  const dateStr = date.toISOString().split("T")[0];

  const [block] = await db
    .select({ id: mentorBlocks.id })
    .from(mentorBlocks)
    .where(
      and(
        lte(mentorBlocks.startDate, dateStr),
        gte(mentorBlocks.endDate, dateStr)
      )
    )
    .limit(1);

  return !!block;
}

export function getEffectiveEndDate(
  currentPeriodEnd: Date,
  bonusDays: number
): Date {
  return addDays(currentPeriodEnd, bonusDays);
}

export async function getUserBookingContext(
  userId: string
): Promise<UserBookingContext> {
  const [subscription, pack] = await Promise.all([
    getUserSubscriptionWithPlan(userId),
    getActivePack(userId),
  ]);

  return { subscription, pack };
}

export function determineDebitSource(
  subscription: SubscriptionWithPlan | null,
  pack: Pack | null,
  scheduledAt: Date
): "subscription" | "pack" {
  if (subscription) {
    const subRemaining =
      subscription.plan.sessionsPerPeriod - subscription.sessionsUsedThisPeriod;

    if (subRemaining > 0) {
      const istDate = toZonedTime(scheduledAt, IST_TIMEZONE);
      const isWeekendDay = isWeekend(istDate);

      if (!isWeekendDay) return "subscription";
      if (subscription.plan.weekendAccess) return "subscription";
      // Weekend + weekday-only plan → fall through to pack
    }
  }

  return "pack";
}

export function isWithinBookingWindow(
  scheduledAt: Date,
  windowDays: number = MENTOR_CONFIG.bookingWindowDays
): boolean {
  const now = new Date();
  const minDate = addDays(startOfDay(now), 1); // Tomorrow at start of day
  const maxDate = addDays(startOfDay(now), windowDays + 1); // N days from tomorrow

  return scheduledAt >= minDate && scheduledAt < maxDate;
}

export function isValidTimeSlot(date: Date): boolean {
  // Convert to IST for time validation
  const istTime = toZonedTime(date, IST_TIMEZONE);
  const hours = istTime.getHours();

  // Afternoon slots: 14:00, 15:00, 16:00, 17:00, 18:00
  return hours >= 14 && hours <= 18 && istTime.getMinutes() === 0;
}

export async function validateBooking(
  userId: string,
  scheduledAt: Date
): Promise<BookingValidationResult> {
  const config = await getMentorConfig();

  // 1. Check user has at least one session source
  const { subscription, pack } = await getUserBookingContext(userId);
  if (!subscription && !pack) {
    return {
      valid: false,
      error: "no_session_source",
      message: "You need an active subscription or session pack to book",
    };
  }

  // 2. Check subscription expiry (only if subscription exists)
  let subRemaining = 0;
  if (subscription) {
    const effectiveEnd = getEffectiveEndDate(
      subscription.currentPeriodEnd,
      subscription.bonusDays
    );
    if (new Date() <= effectiveEnd) {
      subRemaining =
        subscription.plan.sessionsPerPeriod - subscription.sessionsUsedThisPeriod;
    }
  }

  // 3. Check total sessions remaining across both sources
  const packRemaining = pack?.sessionsRemaining ?? 0;
  if (subRemaining + packRemaining <= 0) {
    return {
      valid: false,
      error: "no_sessions_remaining",
      message: "You have used all your sessions for this period",
    };
  }

  // 4. Check no pending session
  const hasPending = await hasPendingSession(userId);
  if (hasPending) {
    return {
      valid: false,
      error: "has_pending_session",
      message: "You already have a scheduled session. Complete or cancel it first.",
    };
  }

  // 5. Check slot is not in the past
  if (scheduledAt <= new Date()) {
    return {
      valid: false,
      error: "slot_in_past",
      message: "Cannot book a session in the past",
    };
  }

  // 6. Check valid time slot (14:00-18:00 IST, on the hour)
  if (!isValidTimeSlot(scheduledAt)) {
    return {
      valid: false,
      error: "invalid_time_slot",
      message: "Invalid time slot. Sessions are available at 14:00, 15:00, 16:00, 17:00, and 18:00 IST",
    };
  }

  // 7. Check within booking window
  if (!isWithinBookingWindow(scheduledAt, config.bookingWindowDays)) {
    return {
      valid: false,
      error: "outside_booking_window",
      message: `You can only book sessions 1-${config.bookingWindowDays} days in advance`,
    };
  }

  // 8. Check weekend access — packs always grant weekend access
  const istDate = toZonedTime(scheduledAt, IST_TIMEZONE);
  const weekendAccessAllowed =
    (subscription && subscription.plan.weekendAccess) || !!pack;
  if (isWeekend(istDate) && !weekendAccessAllowed) {
    return {
      valid: false,
      error: "weekend_not_allowed",
      message: "Your plan does not include weekend booking. Upgrade to Anytime or get a session pack for weekends.",
    };
  }

  // 9. Check mentor not blocked
  const blocked = await isDateBlocked(scheduledAt);
  if (blocked) {
    return {
      valid: false,
      error: "mentor_blocked",
      message: "The mentor is unavailable on this date",
    };
  }

  // 10. Check user hasn't already booked this day
  const hasBooked = await hasBookedOnDate(userId, scheduledAt);
  if (hasBooked) {
    return {
      valid: false,
      error: "already_booked_today",
      message: "You can only book one session per day",
    };
  }

  // 11. Check mentor capacity
  const mentorSessions = await getMentorSessionCountOnDate(scheduledAt);
  if (mentorSessions >= config.maxSessionsPerDay) {
    return {
      valid: false,
      error: "mentor_at_capacity",
      message: "All sessions are booked for this day",
    };
  }

  return { valid: true };
}

export function canCancelWithCredit(scheduledAt: Date): boolean {
  const hoursUntilSession = differenceInHours(scheduledAt, new Date());
  return hoursUntilSession >= MENTOR_CONFIG.cancellationNoticeHours;
}
