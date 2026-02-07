"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type TimeSlotProps = {
  time: string;
  hour: number;
  available: boolean;
  reason?: "booked" | "mentor_blocked" | "at_capacity" | "past" | "weekend_restricted";
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

const reasonMessages: Record<NonNullable<TimeSlotProps["reason"]>, string> = {
  booked: "Booked",
  mentor_blocked: "Unavailable",
  at_capacity: "Full",
  past: "Past",
  weekend_restricted: "Weekends unavailable",
};

function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${period}`;
}

export function TimeSlot({
  time,
  hour,
  available,
  reason,
  selected,
  disabled,
  onClick,
}: TimeSlotProps) {
  const isPast = new Date(time) <= new Date();
  const effectiveAvailable = available && !isPast;
  const effectiveReason = isPast ? "past" : reason;
  const isClickable = effectiveAvailable && !disabled;

  return (
    <Button
      variant={selected ? "default" : effectiveAvailable ? "outline" : "ghost"}
      size="sm"
      disabled={!isClickable}
      onClick={isClickable ? onClick : undefined}
      title={!effectiveAvailable && effectiveReason ? reasonMessages[effectiveReason] : undefined}
      className={cn(
        "rounded-full px-4 py-2 min-h-[44px] font-mono text-sm",
        !effectiveAvailable && "opacity-50 cursor-not-allowed",
        selected && "ring-2 ring-primary"
      )}
    >
      <span>{formatHour(hour)}</span>
      {!effectiveAvailable && effectiveReason && (
        <span className="ml-2 text-xs text-muted-foreground">
          {reasonMessages[effectiveReason]}
        </span>
      )}
    </Button>
  );
}
