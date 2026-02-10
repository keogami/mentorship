export const SITE_CONFIG = {
  name: "keogami's mentorship",
  description: "1:1 programming mentorship",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
} as const

export type Plan = {
  id: string
  name: string
  slug: "weekly_weekday" | "monthly_weekday" | "anytime"
  price: number
  displayPrice: string
  period: "week" | "month"
  sessionsPerPeriod: number
  pricePerSession: number
  weekendAccess: boolean
  features: string[]
  featured?: boolean
  savingsMessage?: string
}

export const PLANS: Plan[] = [
  {
    id: "weekly_weekday",
    name: "Weekly Weekday",
    slug: "weekly_weekday",
    price: 3000,
    displayPrice: "₹3,000",
    period: "week",
    sessionsPerPeriod: 3,
    pricePerSession: 1000,
    weekendAccess: false,
    features: [
      "3 sessions per week",
      "Mon-Fri booking only",
      "₹1,000 per session",
      "Cancel anytime",
    ],
  },
  {
    id: "monthly_weekday",
    name: "Monthly Weekday",
    slug: "monthly_weekday",
    price: 9600,
    displayPrice: "₹9,600",
    period: "month",
    sessionsPerPeriod: 12,
    pricePerSession: 800,
    weekendAccess: false,
    featured: true,
    savingsMessage: "Save ₹2,400/month vs Weekly",
    features: [
      "12 sessions per month",
      "Mon-Fri booking only",
      "₹800 per session",
      "Best value for learners",
    ],
  },
  {
    id: "anytime",
    name: "Anytime",
    slug: "anytime",
    price: 10000,
    displayPrice: "₹10,000",
    period: "month",
    sessionsPerPeriod: 8,
    pricePerSession: 1250,
    weekendAccess: true,
    features: [
      "8 sessions per month",
      "Book any day including weekends",
      "₹1,250 per session",
      "Flexible for professionals",
    ],
  },
]

export const MENTOR_CONFIG = {
  maxSessionsPerDay: 5,
  bookingWindowDays: 7,
  cancellationNoticeHours: 4,
  sessionDurationMinutes: 50,
} as const
