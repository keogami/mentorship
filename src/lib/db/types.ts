import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import type {
  coupons,
  mentorBlocks,
  mentorConfig,
  packs,
  plans,
  sessions,
  subscriptionCredits,
  subscriptions,
  users,
} from "./schema"

// User types
export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>

// Plan types
export type Plan = InferSelectModel<typeof plans>
export type NewPlan = InferInsertModel<typeof plans>

// Subscription types
export type Subscription = InferSelectModel<typeof subscriptions>
export type NewSubscription = InferInsertModel<typeof subscriptions>

export type SubscriptionCredit = InferSelectModel<typeof subscriptionCredits>
export type NewSubscriptionCredit = InferInsertModel<typeof subscriptionCredits>

// Session types
export type Session = InferSelectModel<typeof sessions>
export type NewSession = InferInsertModel<typeof sessions>

// Coupon types
export type Coupon = InferSelectModel<typeof coupons>
export type NewCoupon = InferInsertModel<typeof coupons>

export type Pack = InferSelectModel<typeof packs>
export type NewPack = InferInsertModel<typeof packs>

// Mentor types
export type MentorBlock = InferSelectModel<typeof mentorBlocks>
export type NewMentorBlock = InferInsertModel<typeof mentorBlocks>

export type MentorConfig = InferSelectModel<typeof mentorConfig>
export type NewMentorConfig = InferInsertModel<typeof mentorConfig>
