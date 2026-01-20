import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="rounded-lg bg-muted p-8 text-center md:p-12">
        <h2 className="mb-4 text-3xl font-bold">
          Ready to Accelerate Your Growth?
        </h2>
        <p className="mx-auto mb-6 max-w-xl text-muted-foreground">
          Join now and start booking your daily sessions. Your programming
          journey starts today.
        </p>
        <Button size="lg" asChild>
          <a href="/subscribe">Get Started</a>
        </Button>
      </div>
    </section>
  )
}
