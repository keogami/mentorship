import { z } from "zod";

// Calendar booking
export const bookSessionSchema = z.object({
  scheduledAt: z.string().datetime({ message: "Invalid date format" }),
});

// Subscribe
export const subscribeSchema = z.object({
  planId: z.string().uuid({ message: "Invalid plan ID" }),
});

// Subscribe change
export const subscribeChangeSchema = z.object({
  newPlanId: z.string().uuid({ message: "Invalid plan ID" }),
});

// Redeem coupon
export const redeemSchema = z.object({
  code: z
    .string()
    .min(1, { message: "Coupon code is required" })
    .max(50, { message: "Coupon code is too long" })
    .transform((val) => val.trim().toUpperCase()),
});

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
});

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
  expiresAt: z.string().datetime().nullable().optional(),
  maxUses: z
    .number()
    .int()
    .min(1, { message: "Max uses must be at least 1" })
    .nullable()
    .optional(),
});

// Admin: Cancel user
export const cancelUserSchema = z.object({
  reason: z
    .string()
    .transform((val) => val.trim())
    .pipe(z.string().min(1, { message: "Reason is required" }).max(500)),
  blockUser: z.boolean().optional().default(false),
});
