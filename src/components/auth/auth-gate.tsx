import type { ReactNode } from "react"
import { auth } from "@/auth"
import { SignInOptions } from "./sign-in-options"

interface AuthGateProps {
  children: ReactNode
  callbackUrl?: string
}

export async function AuthGate({ children, callbackUrl }: AuthGateProps) {
  const session = await auth()

  if (!session?.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Sign in to continue</h2>
          <p className="text-muted-foreground">
            Create an account or sign in to access the subscription.
          </p>
        </div>
        <SignInOptions callbackUrl={callbackUrl} />
      </div>
    )
  }

  return <>{children}</>
}
