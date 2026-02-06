"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const { data: session } = useSession()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden min-h-[44px] min-w-[44px]">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Mentorship</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-2 px-4">
          {session?.user ? (
            <>
              <p className="text-sm text-muted-foreground py-2">
                {session.user.name || session.user.email}
              </p>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-medium hover:bg-accent min-h-[44px] flex items-center"
              >
                Dashboard
              </Link>
              <Link
                href="/book"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-medium hover:bg-accent min-h-[44px] flex items-center"
              >
                Book Session
              </Link>
              <Link
                href="/sessions"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-medium hover:bg-accent min-h-[44px] flex items-center"
              >
                Session History
              </Link>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-medium hover:bg-accent min-h-[44px] flex items-center"
              >
                Settings
              </Link>
              <Link
                href="/redeem"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-medium hover:bg-accent min-h-[44px] flex items-center"
              >
                Redeem Coupon
              </Link>
              <hr className="my-2" />
              <Button
                variant="outline"
                className="min-h-[44px]"
                onClick={() => {
                  setOpen(false)
                  signOut({ callbackUrl: "/" })
                }}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/subscribe"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-medium hover:bg-accent min-h-[44px] flex items-center"
              >
                Sign In
              </Link>
              <Link
                href="/subscribe"
                onClick={() => setOpen(false)}
              >
                <Button className="w-full min-h-[44px]">Enroll Now</Button>
              </Link>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
