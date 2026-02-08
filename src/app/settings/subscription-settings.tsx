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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Plan } from "@/lib/db/types"

type SafeSubscription = {
  id: string
  userId: string
  status: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  sessionsUsedThisPeriod: number
  planId: string
  pendingPlanChangeId: string | null
  cancelledAt: Date | null
  cancelReason: string | null
  createdAt: Date
}

type SubscriptionSettingsProps = {
  subscription: SafeSubscription
  currentPlan: Plan
  availablePlans: Plan[]
  pendingPlan: Plan | null
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

function formatPrice(priceInr: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(priceInr)
}

export function SubscriptionSettings({
  subscription,
  currentPlan,
  availablePlans,
  pendingPlan,
}: SubscriptionSettingsProps) {
  const router = useRouter()
  const [isChangingPlan, setIsChangingPlan] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  const period = currentPlan.period === "weekly" ? "week" : "month"
  const otherPlans = availablePlans.filter((p) => p.id !== currentPlan.id)

  async function handlePlanChange(newPlanId: string) {
    setIsChangingPlan(true)
    setError(null)
    setSelectedPlanId(newPlanId)

    try {
      const response = await fetch("/api/subscribe/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPlanId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to change plan")
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsChangingPlan(false)
      setSelectedPlanId(null)
    }
  }

  async function handleCancelPendingChange() {
    setIsChangingPlan(true)
    setError(null)

    try {
      const response = await fetch("/api/subscribe/change", {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to cancel plan change")
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsChangingPlan(false)
    }
  }

  async function handleCancelSubscription() {
    setIsCancelling(true)
    setError(null)

    try {
      const response = await fetch("/api/subscribe/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "User requested cancellation" }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to cancel subscription")
      }

      router.push("/subscribe")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setIsCancelling(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your active subscription</CardDescription>
            </div>
            <Badge>Active</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-2xl font-bold">{currentPlan.name}</p>
              <p className="text-muted-foreground">
                {currentPlan.sessionsPerPeriod} sessions per {period}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {formatPrice(currentPlan.priceInr)}
              </p>
              <p className="text-sm text-muted-foreground">per {period}</p>
            </div>
          </div>

          <div className="rounded-lg border p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current period</span>
              <span>
                {formatDate(subscription.currentPeriodStart)} -{" "}
                {formatDate(subscription.currentPeriodEnd)}
              </span>
            </div>
            <div className="mt-2 flex justify-between">
              <span className="text-muted-foreground">Renews on</span>
              <span>{formatDate(subscription.currentPeriodEnd)}</span>
            </div>
          </div>

          {pendingPlan && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Plan change scheduled
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Changing to <strong>{pendingPlan.name}</strong> (
                    {formatPrice(pendingPlan.priceInr)}/
                    {pendingPlan.period === "weekly" ? "week" : "month"}) on{" "}
                    {formatDate(subscription.currentPeriodEnd)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelPendingChange}
                  disabled={isChangingPlan}
                >
                  Cancel Change
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Plan Card */}
      {!pendingPlan && otherPlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Change Plan</CardTitle>
            <CardDescription>
              Switch to a different plan at the end of your current billing
              period
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {otherPlans.map((plan) => {
              const planPeriod = plan.period === "weekly" ? "week" : "month"
              const isLoading = isChangingPlan && selectedPlanId === plan.id

              return (
                <div
                  key={plan.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {plan.sessionsPerPeriod} sessions/{planPeriod} •{" "}
                      {plan.weekendAccess ? "Any day" : "Weekdays only"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-medium">
                      {formatPrice(plan.priceInr)}/{planPeriod}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePlanChange(plan.id)}
                      disabled={isChangingPlan}
                    >
                      {isLoading ? "Changing..." : "Switch"}
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Plan changes take effect at the start of your next billing period.
            </p>
          </CardFooter>
        </Card>
      )}

      {/* Cancel Subscription Card */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">
            Cancel Subscription
          </CardTitle>
          <CardDescription>
            Cancel your subscription and stop future billing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your subscription will be cancelled immediately and you will lose
            access to booking sessions. Any unused sessions will not be
            refunded.
          </p>
        </CardContent>
        <CardFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isCancelling}>
                {isCancelling ? "Cancelling..." : "Cancel Subscription"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will cancel your subscription immediately. You will lose
                  access to:
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    <li>
                      {currentPlan.sessionsPerPeriod -
                        subscription.sessionsUsedThisPeriod}{" "}
                      remaining sessions this {period}
                    </li>
                    <li>Booking new mentorship sessions</li>
                  </ul>
                  <p className="mt-4 font-medium">
                    This action cannot be undone.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancelSubscription}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, Cancel Subscription
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  )
}
