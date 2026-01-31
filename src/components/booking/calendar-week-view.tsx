"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarWeekView({
  days,
  userContext,
  onBook,
  isBooking = false,
}: CalendarWeekViewProps) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const canBook =
    userContext?.hasActiveSubscription &&
    userContext.sessionsRemaining > 0 &&
    !userContext.hasPendingSession;

  const handleSlotClick = (slotTime: string) => {
    if (canBook) {
      setSelectedSlot(slotTime === selectedSlot ? null : slotTime);
    }
  };

  const handleBookClick = async () => {
    if (selectedSlot && canBook) {
      await onBook(selectedSlot);
      setSelectedSlot(null);
    }
  };

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
              Weekdays only (upgrade to Anytime for weekends)
            </div>
          )}
        </div>
      )}

      {!userContext?.hasActiveSubscription && (
        <div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
          Sign in with an active subscription to book sessions.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {days.map((day) => {
          const date = parseISO(day.date);
          const isWeekendDay = day.isWeekend;
          const hasAvailableSlots = day.slots.some((s) => s.available);

          return (
            <Card
              key={day.date}
              className={cn(
                "overflow-hidden",
                day.mentorBlocked && "opacity-60",
                isWeekendDay && !userContext?.weekendAccess && "opacity-50"
              )}
            >
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-center text-sm">
                  <div className="font-medium">{dayNames[day.dayOfWeek]}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(date, "MMM d")}
                  </div>
                </CardTitle>
                {day.mentorBlocked && (
                  <div className="text-center text-xs text-destructive">
                    Unavailable
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-1 p-2">
                {day.slots.map((slot) => (
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
                {!hasAvailableSlots && !day.mentorBlocked && (
                  <div className="py-2 text-center text-xs text-muted-foreground">
                    No slots available
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedSlot && canBook && (
        <div className="sticky bottom-4 flex justify-center">
          <Card className="shadow-lg">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="text-sm">
                <div className="font-medium">
                  {format(parseISO(selectedSlot), "EEEE, MMMM d")}
                </div>
                <div className="text-muted-foreground">
                  {format(parseISO(selectedSlot), "h:mm a")} IST
                </div>
              </div>
              <Button
                onClick={handleBookClick}
                disabled={isBooking}
              >
                {isBooking ? "Booking..." : "Book Session"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSelectedSlot(null)}
                disabled={isBooking}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
