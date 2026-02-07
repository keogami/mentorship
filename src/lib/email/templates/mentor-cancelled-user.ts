import { escapeHtml } from "../escape";

export type MentorCancelledUserData = {
  userName: string;
  reason: string;
  refundAmount: number;
};

function formatPrice(priceInr: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(priceInr);
}

export function mentorCancelledUserEmail(data: MentorCancelledUserData) {
  const hasRefund = data.refundAmount > 0;
  const userName = escapeHtml(data.userName);
  const reason = escapeHtml(data.reason);

  return {
    subject: "Your Mentorship subscription has been terminated",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #111; margin-bottom: 24px;">Subscription Terminated</h1>

  <p>Hi ${userName},</p>

  <p>Your Mentorship subscription has been terminated by the mentor.</p>

  <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 16px; margin: 24px 0;">
    <p style="margin: 0;"><strong>Reason:</strong> ${reason}</p>
  </div>

  ${
    hasRefund
      ? `
  <div style="background: #d4edda; border: 1px solid #28a745; border-radius: 8px; padding: 16px; margin: 24px 0;">
    <p style="margin: 0;">A pro-rata refund of <strong>${formatPrice(data.refundAmount)}</strong> has been issued to your payment method. It may take 5-7 business days to appear.</p>
  </div>
  `
      : ""
  }

  <p>Any scheduled sessions have been cancelled.</p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
  <p style="color: #666; font-size: 14px;">
    This email was sent from Mentorship.
  </p>
</body>
</html>
    `.trim(),
  };
}
