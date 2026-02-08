"use client"

import Image from "next/image"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function AuthButton() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <Button variant="ghost" disabled>
        ...
      </Button>
    )
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {session.user.image && (
            <Image
              src={session.user.image}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded-full"
              referrerPolicy="no-referrer"
            />
          )}
          <span className="text-sm text-muted-foreground">
            {session.user.name || session.user.email}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Sign Out
        </Button>
      </div>
    )
  }

  return (
    <Button variant="ghost" asChild>
      <Link href="/subscribe?callbackUrl=%2Fdashboard">Sign In</Link>
    </Button>
  )
}
