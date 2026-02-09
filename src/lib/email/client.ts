import nodemailer from "nodemailer"
import { stripCrlf } from "./escape"

let transportInstance: nodemailer.Transporter | null = null

function getTransport() {
  if (!transportInstance) {
    const host = process.env.SMTP_HOST || "smtp-relay.gmail.com"
    const port = Number(process.env.SMTP_PORT || "465")
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS

    if (!user || !pass) {
      throw new Error("SMTP_USER and SMTP_PASS must be set")
    }

    transportInstance = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })
  }

  return transportInstance
}

export type EmailMessage = {
  to: string
  subject: string
  html: string
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const transport = getTransport()
  const mentorEmail = process.env.MENTOR_EMAIL

  if (!mentorEmail) {
    throw new Error("MENTOR_EMAIL is not set")
  }

  await transport.sendMail({
    from: `Mentorship <${stripCrlf(mentorEmail)}>`,
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
