"use client"

import { differenceInHours, format, parseISO } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MENTOR_CONFIG } from "@/lib/constants"
import { cn } from "@/lib/utils"

type SessionStatus =
  | "scheduled"
  | "completed"
  | "cancelled_by_user"
  | "cancelled_by_mentor"
  | "no_show"

type Session = {
  id: string
  scheduledAt: string | Date
  durationMinutes: number
  status: SessionStatus
  meetLink?: string | null
  cancelledAt?: string | Date | null
  lateCancel: boolean
  createdAt: string | Date
}

type SessionCardProps = {
  session: Session
  onCancel?: (sessionId: string) => Promise<void>
  isCancelling?: boolean
  showCancelWarning?: boolean
}

const statusLabels: Record<SessionStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled_by_user: "Cancelled",
  cancelled_by_mentor: "Cancelled by mentor",
  no_show: "No show",
}

const statusColors: Record<SessionStatus, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled_by_user:
    "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  cancelled_by_mentor:
    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  no_show: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

function canCancelSession(scheduledAt: Date): {
  canCancel: boolean
  hoursRemaining: number
  willGetCredit: boolean
} {
  const now = new Date()
  const hoursRemaining = differenceInHours(scheduledAt, now)
  const canCancel = hoursRemaining > 0
  const willGetCredit = hoursRemaining >= MENTOR_CONFIG.cancellationNoticeHours

  return { canCancel, hoursRemaining, willGetCredit }
}

export function SessionCard({
  session,
  onCancel,
  isCancelling = false,
  showCancelWarning = true,
}: SessionCardProps) {
  const scheduledAt =
    typeof session.scheduledAt === "string"
      ? parseISO(session.scheduledAt)
      : session.scheduledAt

  const istTime = toZonedTime(scheduledAt, "Asia/Kolkata")
  const isUpcoming = session.status === "scheduled"
  const cancelInfo = isUpcoming ? canCancelSession(scheduledAt) : null

  return (
    <Card className={cn(!isUpcoming && "opacity-75")}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">
            {format(istTime, "EEEE, MMMM d, yyyy")}
          </CardTitle>
          <Badge
            variant="secondary"
            className={cn("shrink-0", statusColors[session.status])}
          >
            {statusLabels[session.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Time: </span>
            <span className="font-medium">{format(istTime, "h:mm a")} IST</span>
          </div>
          <div>
            <span className="text-muted-foreground">Duration: </span>
            <span>{session.durationMinutes} minutes</span>
          </div>
        </div>

        {isUpcoming && session.meetLink && (
          <div className="flex items-center gap-2">
            <a
              href={session.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              Join Google Meet
            </a>
          </div>
        )}

        {session.lateCancel && session.status === "cancelled_by_user" && (
          <div className="text-sm text-amber-600 dark:text-amber-400">
            Late cancellation - session not credited back
          </div>
        )}

        {isUpcoming && cancelInfo && onCancel && (
          <div className="flex items-center gap-3 pt-2">
            {cancelInfo.canCancel ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCancel(session.id)}
                  disabled={isCancelling}
                >
                  {isCancelling ? "Cancelling..." : "Cancel Session"}
                </Button>
                {showCancelWarning && (
                  <span
                    className={cn(
                      "text-xs",
                      cancelInfo.willGetCredit
                        ? "text-muted-foreground"
                        : "text-amber-600 dark:text-amber-400"
                    )}
                  >
                    {cancelInfo.willGetCredit
                      ? `${cancelInfo.hoursRemaining}h remaining - session will be credited back`
                      : `Only ${cancelInfo.hoursRemaining}h remaining - session will NOT be credited back`}
                  </span>
                )}
              </>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="opacity-50">
                    Cancel Session
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Cancellation Unavailable
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Sessions can only be cancelled before the scheduled start
                      time. Once the session time has passed, cancellation is no
                      longer available.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogAction>Understood</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
