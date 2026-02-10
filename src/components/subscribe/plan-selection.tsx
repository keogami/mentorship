"use client"

import { useTheme } from "next-themes"
import { useCallback, useEffect, useState } from "react"
import type { Plan } from "@/lib/db/types"
import { loadRazorpayScript } from "@/lib/razorpay/types"
import { PlanCard } from "./plan-card"

type PlanSelectionProps = {
  razorpayKeyId: string
  userEmail?: string
}

export function PlanSelection({
  razorpayKeyId,
  userEmail,
}: PlanSelectionProps) {
  const { resolvedTheme } = useTheme()
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    loadRazorpayScript().then(setScriptLoaded)
  }, [])

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch("/api/plans")
        if (!response.ok) throw new Error("Failed to fetch plans")
        const data = await response.json()
        // Sort plans in order: weekly, monthly, anytime
        const sorted = data.sort((a: Plan, b: Plan) => {
          const order = ["weekly_weekday", "monthly_weekday", "anytime"]
          return order.indexOf(a.slug) - order.indexOf(b.slug)
        })
        setPlans(sorted)
      } catch {
        setError("Failed to load plans. Please refresh the page.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchPlans()
  }, [])

  const handleSelectPlan = useCallback(
    async (planId: string) => {
      if (!scriptLoaded) {
        setError("Payment system is loading. Please try again.")
        return
      }

      setSelectedPlanId(planId)
      setError(null)

      try {
        const response = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to create subscription")
        }

        const { subscriptionId } = await response.json()
        const plan = plans.find((p) => p.id === planId)

        const options = {
          key: razorpayKeyId,
          subscription_id: subscriptionId,
          name: "keogami's mentorship",
          description: `${plan?.name || "Plan"} Subscription`,
          prefill: userEmail ? { email: userEmail } : undefined,
          handler: () => {
            window.location.href = "/dashboard"
          },
          theme: {
            color: "#1e1e2e",
          },
          display: {
            widget: {
              main: {
                isDarkMode: resolvedTheme === "dark",
              },
            },
          },
          modal: {
            ondismiss: () => {
              setSelectedPlanId(null)
            },
          },
        }

        const razorpay = new window.Razorpay(options)
        razorpay.open()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong")
        setSelectedPlanId(null)
      }
    },
    [plans, razorpayKeyId, userEmail, scriptLoaded, resolvedTheme]
  )

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-3 md:items-center">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-96 animate-pulse rounded-lg border bg-muted"
          />
        ))}
      </div>
    )
  }

  if (error && plans.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center text-destructive">
          {error}
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-3 md:items-center">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            featured={plan.slug === "monthly_weekday"}
            onSelect={handleSelectPlan}
            isLoading={selectedPlanId === plan.id}
            disabled={selectedPlanId !== null && selectedPlanId !== plan.id}
          />
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        All plans include 50-minute sessions with 4-hour cancellation policy
      </p>
    </div>
  )
}
