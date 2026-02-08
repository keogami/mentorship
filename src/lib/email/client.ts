import { google } from "googleapis"
import { stripCrlf } from "./escape"

let gmailInstance: ReturnType<typeof google.gmail> | null = null

function getGmail() {
  if (!gmailInstance) {
    const keyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    if (!keyBase64) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is not set")
    }

    const keyJson = Buffer.from(keyBase64, "base64").toString("utf-8")
    const credentials = JSON.parse(keyJson)

    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/gmail.send"],
      subject: process.env.MENTOR_EMAIL,
    })

    gmailInstance = google.gmail({ version: "v1", auth })
  }

  return gmailInstance
}

export type EmailMessage = {
  to: string
  subject: string
  html: string
}

// TODO: use a proper templating system for generating email. can just use react for this tbh
export async function sendEmail(message: EmailMessage): Promise<void> {
  const gmail = getGmail()
  const mentorEmail = process.env.MENTOR_EMAIL

  if (!mentorEmail) {
    throw new Error("MENTOR_EMAIL is not set")
  }

  // Strip CRLF from header values to prevent header injection
  const safeTo = stripCrlf(message.to)
  const safeSubject = stripCrlf(message.subject)
  const safeFrom = stripCrlf(mentorEmail)

  // Create raw email message
  const email = [
    `From: Mentorship <${safeFrom}>`,
    `To: ${safeTo}`,
    `Subject: ${safeSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    "",
    message.html,
  ].join("\r\n")

  // Base64 encode the email
  const encodedMessage = Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage,
    },
  })
}

export async function sendBulkEmails(messages: EmailMessage[]): Promise<void> {
  // Send emails in parallel, but with a limit to avoid rate limiting
  // TODO: make the batch size configurable via the admin panel
  const batchSize = 5
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize)
    await Promise.all(batch.map((msg) => sendEmail(msg).catch(console.error)))
  }
}
