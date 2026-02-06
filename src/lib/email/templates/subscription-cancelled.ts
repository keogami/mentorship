export type SubscriptionCancelledData = {
  userName: string;
  planName: string;
};

export function subscriptionCancelledEmail(data: SubscriptionCancelledData) {
  return {
    subject: `Your ${data.planName} subscription has been cancelled`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #111; margin-bottom: 24px;">Subscription Cancelled</h1>

  <p>Hi ${data.userName},</p>

  <p>Your <strong>${data.planName}</strong> subscription has been cancelled. You will no longer be charged.</p>

  <p>Any scheduled sessions have been cancelled. If you had unused sessions, they are no longer available.</p>

  <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 24px 0;">
    <p style="margin: 0;"><strong>Want to come back?</strong></p>
    <p style="margin: 8px 0 0 0;">You can resubscribe anytime from the website.</p>
  </div>

  <p>Thank you for being part of Mentorship!</p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
  <p style="color: #666; font-size: 14px;">
    This email was sent from Mentorship. If you have any questions, reply to this email.
  </p>
</body>
</html>
    `.trim(),
  };
}
