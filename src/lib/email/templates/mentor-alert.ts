export type MentorAlertData = {
  title: string;
  message: string;
  details?: Record<string, string>;
};

export function mentorAlertEmail(data: MentorAlertData) {
  const detailsHtml = data.details
    ? `
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      ${Object.entries(data.details)
        .map(
          ([key, value]) => `
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9; white-space: nowrap;">${key}</td>
          <td style="padding: 8px 12px; border: 1px solid #ddd; font-family: monospace;">${value}</td>
        </tr>`
        )
        .join("")}
    </table>`
    : "";

  return {
    subject: `[Alert] ${data.title}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #111; margin-bottom: 24px;">Alert: ${data.title}</h1>

  <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
    <p style="margin: 0; color: #991b1b;">${data.message}</p>
  </div>

  ${detailsHtml}

  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
  <p style="color: #666; font-size: 14px;">
    This is an automated alert from Mentorship. Check Vercel logs for more context.
  </p>
</body>
</html>
    `.trim(),
  };
}
