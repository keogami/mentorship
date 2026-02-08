import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { SignInOptions } from "@/components/auth/sign-in-options"
import { sanitizeCallbackUrl } from "@/lib/auth/sanitize-callback"

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const session = await auth()

  const { callbackUrl } = await searchParams
  const safeCallbackUrl = sanitizeCallbackUrl(callbackUrl)

  // Already authenticated — redirect to intended destination
  if (session?.user) {
    redirect(safeCallbackUrl)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Sign in to continue</h2>
        <p className="text-muted-foreground">
          Sign in with your GitHub or Google account to get started.
        </p>
      </div>
      <SignInOptions callbackUrl={safeCallbackUrl} />
    </div>
  )
}
