import { AuthGate } from "@/components/auth/auth-gate";
import { PlanSelection } from "@/components/subscribe";

export default function SubscribePage() {
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;

  if (!razorpayKeyId) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto text-center space-y-6">
          <h1 className="text-3xl font-bold">Subscribe to Mentorship</h1>
          <div className="rounded-lg border p-6 bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Payment system is not configured. Please contact the administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <AuthGate callbackUrl="/subscribe">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Choose Your Plan
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Select the plan that fits your learning schedule
            </p>
          </div>
          <PlanSelection razorpayKeyId={razorpayKeyId} />
        </div>
      </AuthGate>
    </div>
  );
}
