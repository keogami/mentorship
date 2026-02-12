import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "terms of service | keogami's mentorship",
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-3xl space-y-10">
        <div>
          <h1 className="cli-prompt text-3xl font-bold">terms of service</h1>
          <p className="text-muted-foreground">
            last updated: february 2025
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">overview</h2>
          <p className="text-muted-foreground leading-relaxed">
            This is a 1:1 programming mentorship platform. You book sessions,
            the mentor shows up. The service is operated by [Your Name] as an
            individual offering.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            By using this platform you agree to these terms. If you
            don&apos;t agree, please don&apos;t use the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">eligibility</h2>
          <p className="text-muted-foreground leading-relaxed">
            To use this platform you must authenticate with a GitHub or Google
            account. Anonymous browsing is allowed, but you need to sign in
            before subscribing or booking sessions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">subscriptions & payments</h2>
          <p className="text-muted-foreground leading-relaxed">
            All payments are processed by Razorpay. Subscriptions are
            auto-renewing &mdash; you&apos;ll be charged at the start of each
            billing cycle (weekly or monthly depending on your plan).
          </p>
          <p className="text-muted-foreground leading-relaxed">
            You can cancel your subscription at any time. Cancellation takes
            effect at the end of your current billing cycle &mdash; you keep
            access until then. There are no partial refunds for user-initiated
            cancellations.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            If the mentor cancels your subscription, you&apos;ll receive a
            pro-rata refund for the unused portion of your billing period.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">session packs</h2>
          <p className="text-muted-foreground leading-relaxed">
            Session packs are separate from subscriptions. They can be obtained
            via coupons or purchased as bundles. Pack sessions expire on the 1st
            of the next month regardless of when they were added. There is no
            rollover and no refunds on unused pack sessions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">booking & cancellation</h2>
          <p className="text-muted-foreground leading-relaxed">
            You can have at most 1 pending (scheduled) session at a time and can
            book up to 1 session per day. Bookings must be made 1&ndash;7 days
            in advance. Sessions are 50 minutes.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">4-hour cancellation policy:</strong>{" "}
            Cancel with 4 or more hours of notice and the session credit is
            returned to you. Cancel with less than 4 hours of notice and the
            session is forfeited &mdash; it counts as used.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">mentor availability</h2>
          <p className="text-muted-foreground leading-relaxed">
            The mentor may block date ranges when unavailable (vacation,
            emergencies, etc.). If you have a session booked during a blocked
            period, it will be automatically cancelled and the credit returned
            to you. Bonus days are added to your subscription to compensate for
            blocked dates.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">account termination</h2>
          <p className="text-muted-foreground leading-relaxed">
            The mentor reserves the right to cancel your subscription and block
            your account for violations of these terms or disruptive behavior. In
            such cases you&apos;ll receive a pro-rata refund for the unused
            portion of your current billing period.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">limitation of liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            The service is provided &ldquo;as is&rdquo; without warranties of
            any kind. There are no guarantees on specific outcomes from
            mentorship sessions. The operator is not responsible for outages or
            issues caused by third-party services (Razorpay, Google, GitHub,
            etc.).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">changes to terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            These terms may be updated from time to time. Continued use of the
            platform after changes constitutes acceptance of the updated terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">governing law</h2>
          <p className="text-muted-foreground leading-relaxed">
            These terms are governed by and construed in accordance with
            applicable laws. Any disputes will be resolved through the
            appropriate legal channels.
          </p>
        </section>
      </div>
    </div>
  )
}
