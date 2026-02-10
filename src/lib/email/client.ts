import nodemailer from "nodemailer"
import { stripCrlf } from "./escape"

function createTransport() {
  const host = process.env.SMTP_HOST || "smtp-relay.gmail.com"
  const port = Number(process.env.SMTP_PORT || "465")
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!user || !pass) {
    throw new Error("SMTP_USER and SMTP_PASS must be set")
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export type EmailMessage = {
  to: string
  subject: string
  html: string
}

async function trySendEmail(
  transport: nodemailer.Transporter,
  mailOptions: nodemailer.SendMailOptions
): Promise<void> {
  const maxRetries = 2
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await transport.sendMail(mailOptions)
      return
    } catch (err: unknown) {
      const isTransient =
        err instanceof Error &&
        "responseCode" in err &&
        (err as { responseCode: number }).responseCode === 421
      if (!isTransient || attempt === maxRetries) throw err
      // Wait before retrying (1s, then 2s)
      await new Promise((r) => setTimeout(r, (attempt + 1) * 1000))
    }
  }
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const mentorEmail = process.env.MENTOR_EMAIL

  if (!mentorEmail) {
    throw new Error("MENTOR_EMAIL is not set")
  }

  const transport = createTransport()
  await trySendEmail(transport, {
    from: `keogami's mentorship <${stripCrlf(mentorEmail)}>`,
    to: stripCrlf(message.to),
    subject: stripCrlf(message.subject),
    html: message.html,
  })
}

export async function sendBulkEmails(messages: EmailMessage[]): Promise<void> {
  const batchSize = 5
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize)
    await Promise.all(batch.map((msg) => sendEmail(msg).catch(console.error)))
  }
}
