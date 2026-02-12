import { Client } from "@upstash/qstash"

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const token = process.env.QSTASH_TOKEN
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

    if (!token || !siteUrl) {
      console.warn("[instrumentation] Missing QSTASH_TOKEN or NEXT_PUBLIC_SITE_URL — skipping schedule registration")
      return
    }

    const client = new Client({ token })

    await client.schedules.create({
      scheduleId: "session-completion",
      destination: `${siteUrl}/api/cron/complete-sessions`,
      cron: "CRON_TZ=Asia/Kolkata 51 14,15,16,17,18 * * *",
      retries: 3,
    })

    console.log("[instrumentation] Registered QStash schedule: session-completion")
  }
}
