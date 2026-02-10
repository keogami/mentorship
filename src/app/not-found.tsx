import Link from "next/link"
import { GoBackButton } from "@/components/layout/go-back-button"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function NotFound() {
  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 rounded-lg border bg-card p-6 text-left">
        <p className="text-sm text-muted-foreground">
          <span className="text-primary">$</span> find /requested-page
        </p>
        <p className="text-sm text-destructive">
          find: &apos;/requested-page&apos;: No such file or directory
        </p>
      </div>
      <h1 className="text-7xl font-bold tracking-tighter">404</h1>
      <p className="mt-4 text-xl text-muted-foreground">page not found</p>
      <p className="mt-2 text-sm text-muted-foreground">
        the page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex gap-3">
        <GoBackButton fallback="/" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild>
              <Link href="/">cd ~</Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Go to homepage</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
