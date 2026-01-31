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
  hour,
  available,
  reason,
  selected,
  disabled,
  onClick,
}: TimeSlotProps) {
  const isClickable = available && !disabled;

  return (
    <Button
      variant={selected ? "default" : available ? "outline" : "ghost"}
      size="sm"
      disabled={!isClickable}
      onClick={isClickable ? onClick : undefined}
      className={cn(
        "w-full justify-start font-mono text-sm",
        !available && "opacity-50 cursor-not-allowed",
        selected && "ring-2 ring-primary"
      )}
    >
      <span>{formatHour(hour)}</span>
      {!available && reason && (
        <span className="ml-auto text-xs text-muted-foreground">
          {reasonMessages[reason]}
        </span>
      )}
    </Button>
  );
}
