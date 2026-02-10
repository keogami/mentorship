import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PLANS, type Plan } from "@/lib/constants"
import { cn } from "@/lib/utils"

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <Card
      className={cn(
        "relative flex flex-col",
        plan.featured && "border-primary shadow-lg scale-105"
      )}
    >
      {plan.featured && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          recommended
        </Badge>
      )}
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>
          {plan.sessionsPerPeriod} sessions/{plan.period}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 text-center">
        <div className="text-4xl font-bold">
          {plan.displayPrice}
          <span className="text-lg font-normal text-muted-foreground">
            /{plan.period}
          </span>
        </div>
        {plan.savingsMessage && (
          <p className="mt-2 text-sm font-medium text-green-600">
            {plan.savingsMessage}
          </p>
        )}
        <ul className="mt-6 space-y-2 text-left">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <CheckIcon /> {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="w-full"
              size="lg"
              variant={plan.featured ? "default" : "outline"}
              asChild
            >
              <a href={`/subscribe?plan=${plan.slug}`}>
                {plan.featured ? "./subscribe.sh" : "select"}
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {plan.featured ? "Subscribe to this plan" : "Choose this plan"}
          </TooltipContent>
        </Tooltip>
      </CardFooter>
    </Card>
  )
}

export function PricingSection() {
  return (
    <section id="pricing" className="container mx-auto px-4 py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="cli-prompt text-3xl font-bold tracking-tight sm:text-4xl">
            pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            select a plan
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3 md:items-center">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          All plans include 50-minute sessions with 4-hour cancellation policy
        </p>
      </div>
    </section>
  )
}
