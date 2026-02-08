import { z } from "zod"

// Calendar booking
export const bookSessionSchema = z.object({
  scheduledAt: z.string().datetime({ message: "Invalid date format" }),
})

// Subscribe
export const subscribeSchema = z.object({
  planId: z.string().uuid({ message: "Invalid plan ID" }),
})

// Subscribe change
export const subscribeChangeSchema = z.object({
  newPlanId: z.string().uuid({ message: "Invalid plan ID" }),
})

// Redeem coupon
export const redeemSchema = z.object({
  code: z
    .string()
    .min(1, { message: "Coupon code is required" })
    .max(50, { message: "Coupon code is too long" })
    .transform((val) => val.trim().toUpperCase()),
})

// Admin: Create mentor block
export const createBlockSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Invalid date format. Use YYYY-MM-DD.",
  }),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Invalid date format. Use YYYY-MM-DD.",
  }),
  reason: z
    .string()
    .transform((val) => val.trim())
    .pipe(z.string().min(1, { message: "Reason is required" }).max(500)),
})

// Admin: Create coupon
export const createCouponSchema = z.object({
  code: z
    .string()
    .min(1, { message: "Coupon code is required" })
    .max(50, { message: "Coupon code is too long" })
    .transform((val) => val.trim().toUpperCase()),
  sessionsGranted: z
    .number()
    .int()
    .min(1, { message: "Sessions must be at least 1" })
    .max(100, { message: "Sessions cannot exceed 100" }),
  // DEFERRED: .datetime() is deprecated in Zod v4 — migrate to z.iso.datetime() when upgrading
  expiresAt: z.string().datetime().nullable().optional(),
  maxUses: z
    .number()
    .int()
    .min(1, { message: "Max uses must be at least 1" })
    .nullable()
    .optional(),
})

// Subscribe cancel (by user)
export const subscribeCancelSchema = z.object({
  reason: z.string().max(500).optional(),
})

// Admin: Update mentor config
export const updateConfigSchema = z
  .object({
    maxSessionsPerDay: z.number().int().min(1).max(20).optional(),
    bookingWindowDays: z.number().int().min(1).max(30).optional(),
    cancellationNoticeHours: z.number().int().min(0).max(48).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "No valid fields to update",
  })

// Admin: Cancel user
export const cancelUserSchema = z.object({
  reason: z
    .string()
    .transform((val) => val.trim())
    .pipe(z.string().min(1, { message: "Reason is required" }).max(500)),
  blockUser: z.boolean().optional().default(false),
})
