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

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Admin dashboard error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Failed to load the admin dashboard. Please try again.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={reset}>Try Again</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
