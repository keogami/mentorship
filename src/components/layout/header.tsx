import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/auth/auth-button"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          Mentorship
        </Link>
        <div className="flex items-center gap-4">
          <AuthButton />
          <Button asChild>
            <Link href="/subscribe">Enroll Now</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
