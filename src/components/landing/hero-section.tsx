import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function HeroSection() {
  return (
    <section className="container mx-auto flex flex-col items-center justify-center gap-6 px-4 pb-8 pt-24 text-center md:pt-32">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
        <span className="text-primary">$</span> level-up --skill=programming
        <span className="cli-cursor" />
      </h1>
      <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
        1:1 mentorship with daily sessions. Get unstuck faster, build real
        projects, accelerate your career.
      </p>
      <div className="flex gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="lg" asChild>
              <a href="#pricing">./enroll.sh</a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>View pricing plans</TooltipContent>
        </Tooltip>
      </div>
    </section>
  )
}
