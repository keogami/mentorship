"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Settings error:", error);
  }, [error]);

  return (
    <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Failed to load settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            We couldn&apos;t load your settings. Please try again.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={reset}>Try Again</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
