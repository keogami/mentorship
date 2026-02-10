import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function CTASection() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="rounded-lg bg-muted p-8 text-center md:p-12">
        <h2 className="cli-prompt mb-4 text-3xl font-bold">
          ready?
        </h2>
        <p className="mx-auto mb-6 max-w-xl text-muted-foreground">
          Start booking your daily sessions. Your programming journey begins
          now.
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="lg" asChild>
              <a href="/subscribe">./subscribe.sh</a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Subscribe to a plan</TooltipContent>
        </Tooltip>
      </div>
    </section>
  )
}
