import Razorpay from "razorpay"

let razorpayInstance: Razorpay | null = null

export function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID) {
      throw new Error("RAZORPAY_KEY_ID is not set")
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("RAZORPAY_KEY_SECRET is not set")
    }

    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  }

  return razorpayInstance
}

/**
 * Returns the Razorpay key ID for client-side checkout.
 * Exists as a single validation point for the env var — the key is needed
 * both server-side (in getRazorpay) and client-side (passed to the checkout modal).
 */
export function getRazorpayKeyId(): string {
  const keyId = process.env.RAZORPAY_KEY_ID
  if (!keyId) {
    throw new Error("RAZORPAY_KEY_ID is not set")
  }
  return keyId
}
