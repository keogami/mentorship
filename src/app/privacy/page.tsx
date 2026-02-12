import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "privacy policy | keogami's mentorship",
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-3xl space-y-10">
        <div>
          <h1 className="cli-prompt text-3xl font-bold">privacy policy</h1>
          <p className="text-muted-foreground">
            last updated: february 2025
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">what we collect</h2>
          <p className="text-muted-foreground leading-relaxed">
            When you sign in with GitHub or Google, we receive your name, email
            address, and profile picture. We also store your OAuth provider ID
            for authentication purposes. We do not store passwords &mdash;
            authentication is handled entirely by your OAuth provider.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">payment data</h2>
          <p className="text-muted-foreground leading-relaxed">
            Payments are handled entirely by Razorpay. We store Razorpay
            subscription and customer IDs to manage your account, but we never
            see or store your card numbers, bank details, or UPI IDs.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">session data</h2>
          <p className="text-muted-foreground leading-relaxed">
            We store your booking times, cancellation history, and session
            status. We also store Google Calendar event IDs and Google Meet
            links associated with your sessions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">how we use your data</h2>
          <p className="text-muted-foreground leading-relaxed">
            Your data is used to provide the service: authentication, session
            booking, payment processing, and email notifications. We also use
            your email to enforce booking rate limits (not your IP address).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">third-party services</h2>
          <p className="text-muted-foreground leading-relaxed">
            The platform relies on the following third-party services, each of
            which only receives data necessary for its function:
          </p>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
            <li>Razorpay &mdash; payment processing</li>
            <li>Google Calendar + Meet &mdash; session scheduling</li>
            <li>GitHub / Google &mdash; authentication</li>
            <li>Neon &mdash; database hosting (PostgreSQL)</li>
            <li>Upstash QStash &mdash; background task scheduling</li>
            <li>SMTP relay &mdash; email delivery</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">data storage</h2>
          <p className="text-muted-foreground leading-relaxed">
            Your data is stored in a PostgreSQL database hosted on Neon.
            Authentication sessions use JWTs that expire after 7 days.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use a single session cookie for authentication (JWT, 7-day
            expiry). There are no tracking cookies and no advertising cookies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">what we don&apos;t do</h2>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
            <li>We don&apos;t sell your data</li>
            <li>We don&apos;t serve ads</li>
            <li>We don&apos;t track you across other sites</li>
            <li>We don&apos;t profile you for marketing</li>
            <li>We don&apos;t use analytics (currently)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">data retention</h2>
          <p className="text-muted-foreground leading-relaxed">
            Account data is retained while your account exists. Session history
            is retained for record-keeping purposes even after your subscription
            ends.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">your rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            You can request an export or deletion of your data by contacting the
            mentor directly. We&apos;ll respond within a reasonable timeframe.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">changes</h2>
          <p className="text-muted-foreground leading-relaxed">
            This policy may be updated from time to time. Continued use of the
            platform after changes constitutes acceptance of the updated policy.
          </p>
        </section>
      </div>
    </div>
  )
}
