import Razorpay from "razorpay"

let razorpayInstance: Razorpay | null = null

function getRazorpay(): Razorpay {
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

// TODO: this is an unnecessary use of proxy
export const razorpay = new Proxy({} as Razorpay, {
  get(_target, prop) {
    return getRazorpay()[prop as keyof Razorpay]
  },
})

// TODO: looks redundant
export function getRazorpayKeyId(): string {
  const keyId = process.env.RAZORPAY_KEY_ID
  if (!keyId) {
    throw new Error("RAZORPAY_KEY_ID is not set")
  }
  return keyId
}
