// The `razorpay` npm package ships server-side types (subscriptions, payments, etc.).
// These client-side types (RazorpayOptions, RazorpayInstance, Window.Razorpay) are
// for the browser checkout modal loaded via <script>, which has no official typings.
export type RazorpayOptions = {
  key: string
  subscription_id: string
  name: string
  description: string
  handler: (response: RazorpayResponse) => void
  prefill?: {
    name?: string
    email?: string
  }
  theme?: {
    color?: string
  }
  modal?: {
    ondismiss?: () => void
  }
}

export type RazorpayInstance = {
  open: () => void
  close: () => void
}

export type RazorpayResponse = {
  razorpay_payment_id: string
  razorpay_subscription_id: string
  razorpay_signature: string
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}
