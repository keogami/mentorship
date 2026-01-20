import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="container mx-auto flex flex-col items-center justify-center gap-6 px-4 pb-8 pt-24 text-center md:pt-32">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
        Level Up Your Programming Skills
      </h1>
      <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
        Personal 1:1 mentorship with daily sessions included. Get unstuck
        faster, build real projects, and accelerate your career.
      </p>
      <div className="flex gap-4">
        <Button size="lg" asChild>
          <a href="#pricing">Start Your Journey</a>
        </Button>
      </div>
    </section>
  )
}
