"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type TodaySession = {
  id: string
  scheduledAt: string
  status: string
  meetLink: string | null
  durationMinutes: number
  user: { name: string; email: string }
}

type ActiveBlock = {
  id: string
  startDate: string
  endDate: string
  reason: string
}

type Stats = {
  activeSubscribers: number
  sessionsToday: number
  sessionsThisWeek: number
  totalSessionsAllTime: number
}

type DashboardTabProps = {
  todaySessions: TodaySession[]
  stats: Stats
  activeBlocks: ActiveBlock[]
}

function formatTime(dateStr: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    hour12: true,
  }).format(new Date(dateStr))
}

function statusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "scheduled":
      return "default"
    case "completed":
      return "secondary"
    case "cancelled_by_user":
    case "cancelled_by_mentor":
      return "destructive"
    default:
      return "outline"
  }
}

export function DashboardTab({
  todaySessions,
  stats,
  activeBlocks,
}: DashboardTabProps) {
  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.activeSubscribers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sessions Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.sessionsToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sessions This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.sessionsThisWeek}</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {todaySessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sessions scheduled today.
            </p>
          ) : (
            <div className="space-y-3">
              {todaySessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{session.user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.user.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(session.scheduledAt)} &middot;{" "}
                      {session.durationMinutes} min
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant(session.status)}>
                      {session.status.replace(/_/g, " ")}
                    </Badge>
                    {session.meetLink && session.status === "scheduled" && (
                      <a
                        href={session.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Meet
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active blocks */}
      {activeBlocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Blocks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeBlocks.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950"
                >
                  <div>
                    <p className="font-medium">{block.reason}</p>
                    <p className="text-sm text-muted-foreground">
                      {block.startDate} to {block.endDate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
