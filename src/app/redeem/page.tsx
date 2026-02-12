import type { Metadata } from "next"
import { AuthGate } from "@/components/auth/auth-gate"
import { RedeemClient } from "./redeem-client"

export const metadata: Metadata = {
  title: "redeem coupon",
}

export default async function RedeemPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams

  return (
    <div className="container mx-auto px-4 py-16">
      <AuthGate callbackUrl={code ? `/redeem?code=${code}` : "/redeem"}>
        <div className="mx-auto max-w-md">
          <RedeemClient initialCode={code} />
        </div>
      </AuthGate>
    </div>
  )
}
