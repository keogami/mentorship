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

export function PricingSection() {
  return (
    <section id="pricing" className="container mx-auto px-4 py-16 md:py-24">
      <div className="mx-auto max-w-md">
        <Card className="relative">
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
            Limited Availability
          </Badge>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Monthly Mentorship</CardTitle>
            <CardDescription>
              Everything you need to accelerate your growth
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-bold">
              &#8377;8,000
              <span className="text-lg font-normal text-muted-foreground">
                /month
              </span>
            </div>
            <ul className="mt-6 space-y-2 text-left">
              <li className="flex items-center gap-2">
                <CheckIcon /> Daily 1:1 sessions
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon /> Book up to 30 days ahead
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon /> Flexible scheduling
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon /> Cancel anytime
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg" asChild>
              <a href="/subscribe">Enroll Now</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  )
}
