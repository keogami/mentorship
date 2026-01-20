import { AuthGate } from "@/components/auth/auth-gate"

export default function SubscribePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <AuthGate callbackUrl="/subscribe">
        <div className="max-w-lg mx-auto text-center space-y-6">
          <h1 className="text-3xl font-bold">Subscribe to Mentorship</h1>
          <p className="text-muted-foreground">
            Get access to daily 1:1 programming sessions for just ₹8,000/month.
          </p>
          <div className="rounded-lg border p-6 bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Payment integration coming soon. You are signed in and ready to subscribe.
            </p>
          </div>
        </div>
      </AuthGate>
    </div>
  )
}
