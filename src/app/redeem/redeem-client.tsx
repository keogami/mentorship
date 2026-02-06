"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

type RedeemResult = {
  pack: {
    sessionsTotal: number;
    sessionsRemaining: number;
    expiresAt: string;
  };
  sessionsAdded: number;
};

export function RedeemClient({ initialCode }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RedeemResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to redeem coupon");
        return;
      }

      setResult(data);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Coupon Redeemed</CardTitle>
          <CardDescription>
            {result.sessionsAdded} session{result.sessionsAdded !== 1 ? "s" : ""} added to your pack
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="rounded-lg border p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Session Pack</p>
            <p className="text-2xl font-bold">
              {result.pack.sessionsRemaining} / {result.pack.sessionsTotal} sessions
            </p>
            <p className="text-sm text-muted-foreground">
              Valid until {formatDate(result.pack.expiresAt)}
            </p>
            <p className="text-sm text-muted-foreground">
              Book any day including weekends
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button asChild>
            <Link href="/book">Book a Session</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Redeem a Coupon</CardTitle>
        <CardDescription>
          Enter your coupon code to get session credits
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <Input
            placeholder="Enter coupon code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isSubmitting}
            className="uppercase"
          />
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting || !code.trim()}>
            {isSubmitting ? "Redeeming..." : "Redeem"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
