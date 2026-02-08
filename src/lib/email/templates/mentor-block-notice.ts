import { format } from "date-fns"
import { escapeHtml } from "../escape"

export type MentorBlockNoticeData = {
  userName: string
  startDate: Date
  endDate: Date
  reason: string
  bonusDays: number
}

export function mentorBlockNoticeEmail(data: MentorBlockNoticeData) {
  const startStr = format(data.startDate, "EEEE, MMMM d")
  const endStr = format(data.endDate, "EEEE, MMMM d, yyyy")
  const userName = escapeHtml(data.userName)
  const reason = escapeHtml(data.reason)

  return {
    subject: `Mentor unavailable ${startStr} - ${endStr}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #111; margin-bottom: 24px;">Mentor Unavailable Notice</h1>

  <p>Hi ${userName},</p>

  <p>I wanted to let you know that I will be unavailable for sessions during the following period:</p>

  <div style="background: #fef3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin: 24px 0;">
    <p style="margin: 0 0 8px 0;"><strong>Dates:</strong> ${startStr} - ${endStr}</p>
    <p style="margin: 0;"><strong>Reason:</strong> ${reason}</p>
  </div>

  <div style="background: #d4edda; border: 1px solid #28a745; border-radius: 8px; padding: 16px; margin: 24px 0;">
    <p style="margin: 0;"><strong>Good news:</strong> ${data.bonusDays} bonus day${data.bonusDays > 1 ? "s" : ""} ha${data.bonusDays > 1 ? "ve" : "s"} been added to your subscription to make up for this time.</p>
  </div>

  <p>If you had any sessions booked during this time, they have been cancelled and your session credits have been restored.</p>

  <p>Thank you for your understanding!</p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
  <p style="color: #666; font-size: 14px;">
    This email was sent from Mentorship. If you have any questions, reply to this email.
  </p>
</body>
</html>
    `.trim(),
  }
}
