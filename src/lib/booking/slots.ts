import { db } from "@/lib/db";
import { sessions, mentorBlocks } from "@/lib/db/schema";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import {
  addDays,
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  isWeekend,
  format,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { getMentorConfig } from "./validation";

const IST_TIMEZONE = "Asia/Kolkata";
const SLOT_HOURS = [14, 15, 16, 17, 18]; // 2PM - 6PM IST

export type TimeSlot = {
  time: string; // ISO string
  hour: number;
  available: boolean;
  reason?: "booked" | "mentor_blocked" | "at_capacity" | "past" | "weekend_restricted";
};

export type DaySlots = {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  isWeekend: boolean;
  slots: TimeSlot[];
  mentorBlocked: boolean;
  totalBooked: number;
  mentorCapacity: number;
};

export type SlotsResponse = {
  days: DaySlots[];
  userContext: {
    sessionsRemaining: number;
    hasPendingSession: boolean;
    weekendAccess: boolean;
    hasActiveSubscription: boolean;
  } | null;
};

function createTimeSlot(date: Date, hour: number): Date {
  // Create a time in IST, then convert to UTC
  const istDate = setMilliseconds(
    setSeconds(setMinutes(setHours(date, hour), 0), 0),
    0
  );
  return fromZonedTime(istDate, IST_TIMEZONE);
}

export async function generateSlots(
  userId: string | null,
  weekendAccess: boolean,
  hasPendingSession: boolean
): Promise<DaySlots[]> {
  const config = await getMentorConfig();
  const now = new Date();
  const days: DaySlots[] = [];

  // Generate slots for next 7 days starting from tomorrow
  for (let i = 1; i <= config.bookingWindowDays; i++) {
    const dayStart = startOfDay(addDays(now, i));
    const dayEnd = endOfDay(dayStart);
    const istDayStart = toZonedTime(dayStart, IST_TIMEZONE);
    const dateStr = format(istDayStart, "yyyy-MM-dd");
    const dayOfWeek = istDayStart.getDay();
    const dayIsWeekend = isWeekend(istDayStart);

    // Check if mentor is blocked this day
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

    const mentorBlocked = !!block;

    // Get all booked sessions for this day
    const bookedSessions = await db
      .select({
        scheduledAt: sessions.scheduledAt,
      })
      .from(sessions)
      .where(
        and(
          gte(sessions.scheduledAt, dayStart),
          lte(sessions.scheduledAt, dayEnd),
          eq(sessions.status, "scheduled")
        )
      );

    const bookedTimes = new Set(
      bookedSessions.map((s) => {
        const istTime = toZonedTime(s.scheduledAt, IST_TIMEZONE);
        return istTime.getHours();
      })
    );

    // Check if user already booked this day
    let userBookedThisDay = false;
    if (userId) {
      const [userSession] = await db
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
      userBookedThisDay = !!userSession;
    }

    const totalBooked = bookedSessions.length;
    const atCapacity = totalBooked >= config.maxSessionsPerDay;

    // Generate time slots
    const slots: TimeSlot[] = SLOT_HOURS.map((hour) => {
      const slotTime = createTimeSlot(istDayStart, hour);
      const isPast = slotTime <= now;

      let available = true;
      let reason: TimeSlot["reason"];

      if (isPast) {
        available = false;
        reason = "past";
      } else if (mentorBlocked) {
        available = false;
        reason = "mentor_blocked";
      } else if (dayIsWeekend && !weekendAccess) {
        available = false;
        reason = "weekend_restricted";
      } else if (bookedTimes.has(hour)) {
        available = false;
        reason = "booked";
      } else if (atCapacity) {
        available = false;
        reason = "at_capacity";
      } else if (userBookedThisDay || hasPendingSession) {
        available = false;
        reason = "booked"; // Simplified - user can't book more
      }

      return {
        time: slotTime.toISOString(),
        hour,
        available,
        reason: available ? undefined : reason,
      };
    });

    days.push({
      date: dateStr,
      dayOfWeek,
      isWeekend: dayIsWeekend,
      slots,
      mentorBlocked,
      totalBooked,
      mentorCapacity: config.maxSessionsPerDay,
    });
  }

  return days;
}

export async function getSlotAvailability(
  date: Date
): Promise<{ hour: number; available: boolean }[]> {
  const config = await getMentorConfig();
  const now = new Date();
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  const istDate = toZonedTime(date, IST_TIMEZONE);
  const dateStr = format(istDate, "yyyy-MM-dd");

  // Check mentor block
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

  if (block) {
    return SLOT_HOURS.map((hour) => ({ hour, available: false }));
  }

  // Get booked sessions
  const bookedSessions = await db
    .select({
      scheduledAt: sessions.scheduledAt,
    })
    .from(sessions)
    .where(
      and(
        gte(sessions.scheduledAt, dayStart),
        lte(sessions.scheduledAt, dayEnd),
        eq(sessions.status, "scheduled")
      )
    );

  const bookedTimes = new Set(
    bookedSessions.map((s) => {
      const istTime = toZonedTime(s.scheduledAt, IST_TIMEZONE);
      return istTime.getHours();
    })
  );

  const totalBooked = bookedSessions.length;
  const atCapacity = totalBooked >= config.maxSessionsPerDay;

  return SLOT_HOURS.map((hour) => {
    const slotTime = createTimeSlot(istDate, hour);
    const isPast = slotTime <= now;

    return {
      hour,
      available: !isPast && !bookedTimes.has(hour) && !atCapacity,
    };
  });
}
