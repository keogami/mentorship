"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { CalendarWeekView } from "@/components/booking/calendar-week-view"
import type { DaySlots } from "@/lib/booking/slots"

type BookingClientProps = {
  initialDays: DaySlots[]
  userContext: {
    sessionsRemaining: number
    hasPendingSession: boolean
    weekendAccess: boolean
    hasActiveSubscription: boolean
  } | null
}

export function BookingClient({
  initialDays,
  userContext,
}: BookingClientProps) {
  const router = useRouter()
  const [days, setDays] = useState(initialDays)
  const [isBooking, setIsBooking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const refreshSlots = useCallback(async () => {
    try {
      const response = await fetch("/api/calendar/slots")
      if (response.ok) {
        const data = await response.json()
        setDays(data.days)
      }
    } catch (e) {
      console.error("Failed to refresh slots:", e)
    }
  }, [])

  const handleBook = useCallback(
    async (scheduledAt: string) => {
      setIsBooking(true)
      setError(null)
      setSuccess(null)

      try {
        const response = await fetch("/api/calendar/book", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ scheduledAt }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || "Failed to book session")
          return
        }

        setSuccess(
          `Session booked for ${data.session.formattedDate}. ${data.sessionsRemaining} sessions remaining.`
        )

        // Refresh the slots and redirect
        await refreshSlots()
        router.push("/sessions")
      } catch (e) {
        setError("An unexpected error occurred")
        console.error("Booking error:", e)
      } finally {
        setIsBooking(false)
      }
    },
    [refreshSlots, router]
  )

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-500 bg-green-500/10 p-4 text-green-700 dark:text-green-400">
          {success}
        </div>
      )}
      <CalendarWeekView
        days={days}
        userContext={userContext}
        bookAction={handleBook}
        isBooking={isBooking}
      />
    </div>
  )
}
