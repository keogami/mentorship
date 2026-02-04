"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Config = {
  maxSessionsPerDay: number;
  bookingWindowDays: number;
  cancellationNoticeHours: number;
  updatedAt: string | null;
};

type ConfigTabProps = {
  config: Config;
};

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(dateStr));
}

export function ConfigTab({ config }: ConfigTabProps) {
  const router = useRouter();
  const [maxSessionsPerDay, setMaxSessionsPerDay] = useState(
    config.maxSessionsPerDay
  );
  const [bookingWindowDays, setBookingWindowDays] = useState(
    config.bookingWindowDays
  );
  const [cancellationNoticeHours, setCancellationNoticeHours] = useState(
    config.cancellationNoticeHours
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/admin/api/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxSessionsPerDay,
          bookingWindowDays,
          cancellationNoticeHours,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update config");
      }

      setSuccess("Configuration updated.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Mentor Configuration</CardTitle>
          <CardDescription>
            Adjust booking rules and session limits. Changes take effect
            immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxSessionsPerDay">Max Sessions Per Day</Label>
            <Input
              id="maxSessionsPerDay"
              type="number"
              min="1"
              value={maxSessionsPerDay}
              onChange={(e) =>
                setMaxSessionsPerDay(parseInt(e.target.value, 10) || 1)
              }
            />
            <p className="text-sm text-muted-foreground">
              Maximum number of sessions you can take in a single day.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bookingWindowDays">Booking Window (days)</Label>
            <Input
              id="bookingWindowDays"
              type="number"
              min="1"
              value={bookingWindowDays}
              onChange={(e) =>
                setBookingWindowDays(parseInt(e.target.value, 10) || 1)
              }
            />
            <p className="text-sm text-muted-foreground">
              How far in advance users can book sessions (1 to N days).
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cancellationNoticeHours">
              Cancellation Notice (hours)
            </Label>
            <Input
              id="cancellationNoticeHours"
              type="number"
              min="0"
              value={cancellationNoticeHours}
              onChange={(e) =>
                setCancellationNoticeHours(parseInt(e.target.value, 10) || 0)
              }
            />
            <p className="text-sm text-muted-foreground">
              Minimum hours before a session that users can cancel for a credit
              refund.
            </p>
          </div>
          {config.updatedAt && (
            <p className="text-sm text-muted-foreground">
              Last updated: {formatDate(config.updatedAt)}
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
