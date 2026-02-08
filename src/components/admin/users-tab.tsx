"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type UserSubscription = {
  id: string
  status: string
  planName: string
  planSlug: string
  priceInr: number
  period: string
  sessionsUsed: number
  sessionsTotal: number
  currentPeriodEnd: string
  cancelledAt: string | null
}

type AdminUser = {
  id: string
  name: string
  email: string
  blocked: boolean
  createdAt: string
  contact: string | null
  subscription: UserSubscription
}

type UsersTabProps = {
  users: AdminUser[]
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr))
}

function formatPrice(priceInr: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(priceInr)
}

function statusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default"
    case "cancelled":
      return "destructive"
    case "past_due":
      return "outline"
    default:
      return "secondary"
  }
}

export function UsersTab({ users }: UsersTabProps) {
  const router = useRouter()
  const [cancellingUserId, setCancellingUserId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [blockUser, setBlockUser] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleCancel(userId: string) {
    setCancellingUserId(userId)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/admin/api/users/${userId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason, blockUser }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to cancel subscription")
      }

      const data = await response.json()
      const parts = [
        `Subscription cancelled.`,
        `Refund: ${formatPrice(data.refundAmountInr)}.`,
      ]
      if (data.sessionsAffected > 0) {
        parts.push(`${data.sessionsAffected} session(s) cancelled.`)
      }
      if (data.userBlocked) {
        parts.push("User blocked from resubscribing.")
      }
      setSuccess(parts.join(" "))
      setCancelReason("")
      setBlockUser(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setCancellingUserId(null)
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

      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground">No subscribers yet.</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Period End</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const sub = user.subscription
                const unusedSessions = sub.sessionsTotal - sub.sessionsUsed
                const costPerSession = Math.floor(
                  sub.priceInr / sub.sessionsTotal
                )
                const refundEstimate = Math.max(
                  0,
                  unusedSessions * costPerSession
                )

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.contact ?? "\u2014"}</TableCell>
                    <TableCell>{sub.planName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge variant={statusVariant(sub.status)}>
                          {sub.status}
                        </Badge>
                        {user.blocked && (
                          <Badge variant="destructive">Blocked</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {sub.sessionsUsed}/{sub.sessionsTotal}
                    </TableCell>
                    <TableCell>{formatDate(sub.currentPeriodEnd)}</TableCell>
                    <TableCell>
                      {sub.status === "active" && !user.blocked ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={cancellingUserId === user.id}
                            >
                              Cancel
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Cancel {user.name}&apos;s subscription?
                              </AlertDialogTitle>
                              <AlertDialogDescription asChild>
                                <div className="space-y-3">
                                  <p>
                                    This will immediately cancel their
                                    subscription.
                                  </p>
                                  <p className="rounded border p-2 text-sm">
                                    Estimated refund:{" "}
                                    <strong>
                                      {formatPrice(refundEstimate)}
                                    </strong>{" "}
                                    ({unusedSessions} unused sessions x{" "}
                                    {formatPrice(costPerSession)}/session)
                                  </p>
                                  <div className="space-y-2">
                                    <Label htmlFor={`reason-${user.id}`}>
                                      Reason for cancellation
                                    </Label>
                                    <Input
                                      id={`reason-${user.id}`}
                                      placeholder="e.g., Violation of terms"
                                      value={cancelReason}
                                      onChange={(e) =>
                                        setCancelReason(e.target.value)
                                      }
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id={`block-${user.id}`}
                                      checked={blockUser}
                                      onChange={(e) =>
                                        setBlockUser(e.target.checked)
                                      }
                                      className="h-4 w-4 rounded border-gray-300"
                                    />
                                    <Label htmlFor={`block-${user.id}`}>
                                      Block user from resubscribing
                                    </Label>
                                  </div>
                                </div>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                onClick={() => {
                                  setCancelReason("")
                                  setBlockUser(false)
                                }}
                              >
                                Keep Active
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancel(user.id)}
                                disabled={!cancelReason.trim()}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Cancel Subscription
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          &mdash;
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
