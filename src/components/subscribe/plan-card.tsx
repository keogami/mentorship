"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/db/types";

type PlanCardProps = {
  plan: Plan;
  featured?: boolean;
  onSelect: (planId: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
};

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
  );
}

function formatPrice(priceInr: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(priceInr);
}

function getPlanFeatures(plan: Plan): string[] {
  const features: string[] = [];
  const period = plan.period === "weekly" ? "week" : "month";
  const perSessionPrice = Math.round(plan.priceInr / plan.sessionsPerPeriod);

  features.push(`${plan.sessionsPerPeriod} sessions per ${period}`);

  if (plan.weekendAccess) {
    features.push("Book any day including weekends");
  } else {
    features.push("Mon-Fri booking only");
  }

  features.push(`${formatPrice(perSessionPrice)} per session`);

  if (plan.slug === "monthly_weekday") {
    features.push("Best value for learners");
  } else if (plan.slug === "anytime") {
    features.push("Flexible for professionals");
  } else if (plan.slug === "weekly_weekday") {
    features.push("Cancel anytime");
  }

  return features;
}

function getSavingsMessage(plan: Plan): string | null {
  if (plan.slug === "monthly_weekday") {
    return "Save ₹2,400/month vs Weekly";
  }
  return null;
}

export function PlanCard({
  plan,
  featured,
  onSelect,
  isLoading,
  disabled,
}: PlanCardProps) {
  const features = getPlanFeatures(plan);
  const savingsMessage = getSavingsMessage(plan);
  const period = plan.period === "weekly" ? "week" : "month";

  return (
    <Card
      className={cn(
        "relative flex flex-col",
        featured && "border-primary shadow-lg scale-105"
      )}
    >
      {featured && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          Best Value
        </Badge>
      )}
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>
          {plan.sessionsPerPeriod} sessions/{period}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 text-center">
        <div className="text-4xl font-bold">
          {formatPrice(plan.priceInr)}
          <span className="text-lg font-normal text-muted-foreground">
            /{period}
          </span>
        </div>
        {savingsMessage && (
          <p className="mt-2 text-sm font-medium text-green-600">
            {savingsMessage}
          </p>
        )}
        <ul className="mt-6 space-y-2 text-left">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <CheckIcon /> {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          size="lg"
          variant={featured ? "default" : "outline"}
          onClick={() => onSelect(plan.id)}
          disabled={isLoading || disabled}
        >
          {isLoading ? "Processing..." : featured ? "Get Started" : "Choose Plan"}
        </Button>
      </CardFooter>
    </Card>
  );
}
