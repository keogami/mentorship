export const SITE_CONFIG = {
  name: "Mentorship",
  description: "1:1 Programming Mentorship Platform",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
} as const

export const PRICING = {
  amount: 8000,
  currency: "INR",
  interval: "month",
  displayPrice: "\u20B98,000",
  maxDailySlots: 5,
} as const
