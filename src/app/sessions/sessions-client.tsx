"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { SessionCard } from "@/components/booking/session-card"

type SessionStatus =
  | "scheduled"
  | "completed"
  | "cancelled_by_user"
  | "cancelled_by_mentor"
  | "no_show"

type Session = {
  id: string
  scheduledAt: string
  durationMinutes: number
  status: SessionStatus
  meetLink: string | null
  cancelledAt: string | null
  lateCancel: boolean
  createdAt: string
}

type SessionsClientProps = {
  initialSessions: Session[]
}

export function SessionsClient({ initialSessions }: SessionsClientProps) {
  const router = useRouter()
  const [sessions, setSessions] = useState(initialSessions)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const refreshSessions = useCallback(async () => {
    try {
      const response = await fetch("/api/sessions")
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions)
      }
    } catch (e) {
      console.error("Failed to refresh sessions:", e)
    }
  }, [])

  const handleCancel = useCallback(
    async (sessionId: string) => {
      setCancellingId(sessionId)
      setError(null)
      setSuccessMessage(null)

      try {
        const response = await fetch(`/api/calendar/book/${sessionId}`, {
          method: "DELETE",
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || "Failed to cancel session")
          return
        }

        setSuccessMessage(data.message)
        await refreshSessions()
        router.refresh()
      } catch (e) {
        setError("An unexpected error occurred")
        console.error("Cancel error:", e)
      } finally {
        setCancellingId(null)
      }
    },
    [refreshSessions, router]
  )

  const upcomingSessions = sessions.filter((s) => s.status === "scheduled")
  const pastSessions = sessions.filter((s) => s.status !== "scheduled")

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-green-500 bg-green-500/10 p-4 text-green-700 dark:text-green-400">
          {successMessage}
        </div>
      )}

      <section>
        <h2 className="mb-4 text-xl font-semibold">Upcoming Sessions</h2>
        {upcomingSessions.length === 0 ? (
          <p className="text-muted-foreground">No upcoming sessions</p>
        ) : (
          <div className="space-y-4">
            {upcomingSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onCancel={handleCancel}
                isCancelling={cancellingId === session.id}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Past Sessions</h2>
        {pastSessions.length === 0 ? (
          <p className="text-muted-foreground">No past sessions</p>
        ) : (
          <div className="space-y-4">
            {pastSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
