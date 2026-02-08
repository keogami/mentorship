import Razorpay from "razorpay"

export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  try {
    return Razorpay.validateWebhookSignature(body, signature, secret)
  } catch {
    return false
  }
}

export type RazorpaySubscriptionEvent =
  | "subscription.activated"
  | "subscription.charged"
  | "subscription.cancelled"
  | "subscription.paused"
  | "subscription.resumed"
  | "subscription.pending"
  | "subscription.halted"

export type RazorpayWebhookPayload = {
  entity: "event"
  account_id: string
  event: RazorpaySubscriptionEvent
  contains: string[]
  payload: {
    subscription: {
      entity: {
        id: string
        entity: "subscription"
        plan_id: string
        customer_id: string
        status: string
        current_start: number
        current_end: number
        ended_at: number | null
        quantity: number
        notes: Record<string, string>
        charge_at: number
        offer_id: string | null
        short_url: string
        has_scheduled_changes: boolean
        change_scheduled_at: number | null
        source: string
        payment_method: string
        created_at: number
        expire_by: number | null
        customer_notify: number
        total_count: number
        paid_count: number
        remaining_count: number
      }
    }
    payment?: {
      entity: {
        id: string
        amount: number
        currency: string
        status: string
        method: string
      }
    }
  }
  created_at: number
}
