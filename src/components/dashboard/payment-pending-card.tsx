"use client"

import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function PaymentPendingCard() {
  const router = useRouter()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/me")
        if (!res.ok) return
        const data = await res.json()
        if (data.subscription?.status === "active") {
          if (intervalRef.current) clearInterval(intervalRef.current)
          router.refresh()
        }
      } catch {
        // Silently ignore network errors during polling
      }
    }, 5000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [router])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Pending</CardTitle>
        <CardDescription>
          Your subscription is awaiting payment confirmation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground">
          Please complete your payment to activate your subscription. If
          you&apos;ve already paid, it may take a few moments to process.
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Checking payment status...</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline">
          <Link href="/subscribe">Return to Plans</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
