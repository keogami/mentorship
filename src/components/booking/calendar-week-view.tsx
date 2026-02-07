"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { TimeSlot } from "./time-slot";
import type { DaySlots } from "@/lib/booking/slots";

type CalendarWeekViewProps = {
  days: DaySlots[];
  userContext: {
    sessionsRemaining: number;
    hasPendingSession: boolean;
    weekendAccess: boolean;
    hasActiveSubscription: boolean;
  } | null;
  onBook: (scheduledAt: string) => Promise<void>;
  isBooking?: boolean;
};

export function CalendarWeekView({
  days,
  userContext,
  onBook,
  isBooking = false,
}: CalendarWeekViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const canBook =
    userContext?.hasActiveSubscription &&
    userContext.sessionsRemaining > 0 &&
    !userContext.hasPendingSession;

  // Build a Map<YYYY-MM-DD, DaySlots> for O(1) lookup
  const dayMap = useMemo(() => {
    const map = new Map<string, DaySlots>();
    for (const day of days) {
      map.set(day.date, day);
    }
    return map;
  }, [days]);

  // Default month for the calendar (first bookable day)
  const fromDate = days.length > 0 ? parseISO(days[0].date) : undefined;

  // Set of enabled date strings (within window, not blocked, has at least one available slot or is selectable)
  const enabledDates = useMemo(() => {
    const set = new Set<string>();
    for (const day of days) {
      set.add(day.date);
    }
    return set;
  }, [days]);

  // Disabled date matcher for the Calendar
  const disabledMatcher = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return !enabledDates.has(dateStr);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(null);
      setSelectedSlot(null);
      return;
    }
    const dateStr = format(date, "yyyy-MM-dd");
    setSelectedDate(dateStr);
    setSelectedSlot(null);
  };

  const handleSlotClick = (slotTime: string) => {
    if (canBook) {
      setSelectedSlot(slotTime === selectedSlot ? null : slotTime);
    }
  };

  const handleBookClick = async () => {
    if (selectedSlot && canBook) {
      await onBook(selectedSlot);
      setSelectedSlot(null);
      setSelectedDate(null);
    }
  };

  const currentDay = selectedDate ? dayMap.get(selectedDate) : null;

  return (
    <div className="space-y-6">
      {userContext && (
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Sessions remaining:</span>
            <span className="font-semibold">{userContext.sessionsRemaining}</span>
          </div>
          {userContext.hasPendingSession && (
            <div className="text-amber-600 dark:text-amber-400">
              You have a pending session. Complete or cancel it to book another.
            </div>
          )}
          {!userContext.weekendAccess && (
            <div className="text-muted-foreground">
              Weekdays only (upgrade to Anytime or get a session pack for weekends)
            </div>
          )}
        </div>
      )}

      {!userContext?.hasActiveSubscription && (
        <div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
          Sign in with an active subscription to book sessions.
        </div>
      )}

      <div className="flex flex-col md:flex-row items-start justify-center gap-6">
        {/* Calendar picker */}
        <div className="shrink-0 self-center md:self-start">
          <Calendar
            mode="single"
            selected={selectedDate ? parseISO(selectedDate) : undefined}
            onSelect={handleDateSelect}
            disabled={disabledMatcher}
            defaultMonth={fromDate}
          />
        </div>

        {/* Time slots panel */}
        <div className="flex-1 min-w-0">
          {!selectedDate ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground">
              Select a date to view available times
            </div>
          ) : currentDay ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {format(parseISO(selectedDate), "EEEE, MMM d")}
              </h3>
              {currentDay.mentorBlocked ? (
                <div className="text-sm text-destructive">
                  Mentor is unavailable on this day.
                </div>
              ) : currentDay.slots.every((s) => !s.available) ? (
                <div className="text-sm text-muted-foreground">
                  No available slots on this day.
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {currentDay.slots.map((slot) => (
                  <TimeSlot
                    key={slot.time}
                    time={slot.time}
                    hour={slot.hour}
                    available={slot.available}
                    reason={slot.reason}
                    selected={selectedSlot === slot.time}
                    disabled={!canBook || isBooking}
                    onClick={() => handleSlotClick(slot.time)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {selectedSlot && canBook && (
        <div className="sticky bottom-4 flex justify-center">
          <Card className="shadow-lg w-full sm:w-auto">
            <CardContent className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 p-4">
              <div className="text-sm text-center sm:text-left">
                <div className="font-medium">
                  {format(parseISO(selectedSlot), "EEEE, MMMM d")}
                </div>
                <div className="text-muted-foreground">
                  {format(parseISO(selectedSlot), "h:mm a")} IST
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={handleBookClick}
                  disabled={isBooking}
                  className="flex-1 sm:flex-none min-h-[44px]"
                >
                  {isBooking ? "Booking..." : "Book Session"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedSlot(null)}
                  disabled={isBooking}
                  className="min-h-[44px]"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
