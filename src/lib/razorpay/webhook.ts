import crypto from "node:crypto"

// TODO: check docs razorpay's native signature validation and use that instead: https://github.com/razorpay/razorpay-node/blob/92fe1ceb9300eae630824e4618f640fe7d6e6c0c/lib/razorpay.js#L12
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex")

  const sigBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  // timingSafeEqual throws RangeError if buffers have different lengths
  // TODO: this if statment partially circumvents the use of timingSafeEqual. just wrap in try/catch instead
  if (sigBuffer.length !== expectedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer)
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
