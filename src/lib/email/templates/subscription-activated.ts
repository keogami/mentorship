import { escapeHtml } from "../escape"

export type SubscriptionActivatedData = {
  userName: string
  planName: string
  sessionsPerPeriod: number
  period: "weekly" | "monthly"
}

export function subscriptionActivatedEmail(data: SubscriptionActivatedData) {
  const periodLabel = data.period === "weekly" ? "week" : "month"
  const userName = escapeHtml(data.userName)
  const planName = escapeHtml(data.planName)

  return {
    subject: `Welcome to Mentorship - Your ${data.planName} plan is now active`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #111; margin-bottom: 24px;">Welcome to Mentorship!</h1>

  <p>Hi ${userName},</p>

  <p>Your <strong>${planName}</strong> subscription is now active. You have <strong>${data.sessionsPerPeriod} sessions</strong> available this ${periodLabel}.</p>

  <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 24px 0;">
    <p style="margin: 0 0 8px 0;"><strong>Next steps:</strong></p>
    <ul style="margin: 0; padding-left: 20px;">
      <li>Book your first session from your dashboard</li>
      <li>Sessions are 50 minutes each</li>
      <li>Cancel with at least 4 hours notice to get your session back</li>
    </ul>
  </div>

  <p>Looking forward to our sessions together!</p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
  <p style="color: #666; font-size: 14px;">
    This email was sent from Mentorship. If you have any questions, reply to this email.
  </p>
</body>
</html>
    `.trim(),
  }
}
