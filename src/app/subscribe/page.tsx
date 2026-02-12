import type { Metadata } from "next"
import { and, eq } from "drizzle-orm"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { AuthGate } from "@/components/auth/auth-gate"
import { PlanSelection } from "@/components/subscribe"
import { db } from "@/lib/db"
import { subscriptions, users } from "@/lib/db/schema"

export const metadata: Metadata = {
  title: "subscribe",
}

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID

  if (!razorpayKeyId) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto text-center space-y-6">
          <h1 className="cli-prompt text-3xl font-bold">subscribe</h1>
          <div className="rounded-lg border p-6 bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Payment system is not configured. Please contact the
              administrator.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const { callbackUrl } = await searchParams

  // Check if user is logged in and already has an active subscription
  const session = await auth()
  if (session?.user?.email) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))

    if (user) {
      const [activeSub] = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, user.id),
            eq(subscriptions.status, "active")
          )
        )

      if (activeSub) {
        redirect("/settings")
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <AuthGate callbackUrl={callbackUrl || "/subscribe"}>
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="text-center">
            <h1 className="cli-prompt text-3xl font-bold tracking-tight sm:text-4xl">
              subscribe
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              select a plan that fits your schedule
            </p>
          </div>
          <PlanSelection
            razorpayKeyId={razorpayKeyId}
            userEmail={session?.user?.email ?? undefined}
          />
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Have a coupon code?{" "}
              <Link href="/redeem" className="underline">
                Redeem it here
              </Link>
            </p>
          </div>
        </div>
      </AuthGate>
    </div>
  )
}
