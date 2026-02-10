import Link from "next/link"
import { auth } from "@/auth"
import { AuthButton } from "@/components/auth/auth-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { MobileNav } from "./mobile-nav"

export async function Header() {
  const session = await auth()
  const isLoggedIn = !!session?.user
  const isMentor = isLoggedIn && session.user.email === process.env.MENTOR_EMAIL

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          <span className="text-primary">$</span>{" "}
          <span className="hidden sm:inline">keogami&apos;s mentorship</span>
          <span className="sm:hidden">keogami</span>
        </Link>
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <AuthButton />
          {isLoggedIn ? (
            <Button asChild>
              <Link href={isMentor ? "/admin" : "/dashboard"}>
                {isMentor ? "Admin" : "Dashboard"}
              </Link>
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild>
                  <Link href="/subscribe">./enroll.sh</Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>View pricing plans</TooltipContent>
            </Tooltip>
          )}
        </div>
        <MobileNav isMentor={isMentor} />
      </div>
    </header>
  )
}
