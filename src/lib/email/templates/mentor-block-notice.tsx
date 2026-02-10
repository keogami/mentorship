import { Heading, Section, Text } from "@react-email/components"
import { render } from "@react-email/render"
import { format } from "date-fns"
import { EmailLayout } from "./_layout"

export type MentorBlockNoticeData = {
  userName: string
  startDate: Date
  endDate: Date
  reason: string
  bonusDays: number
}

function MentorBlockNoticeEmail(data: MentorBlockNoticeData) {
  const startStr = format(data.startDate, "EEEE, MMMM d")
  const endStr = format(data.endDate, "EEEE, MMMM d, yyyy")
  const plural = data.bonusDays > 1

  return (
    <EmailLayout preview={`Mentor unavailable ${startStr} - ${endStr}`}>
      <Heading as="h1" style={heading}>
        Mentor Unavailable Notice
      </Heading>

      <Text>Hi {data.userName},</Text>

      <Text>
        I wanted to let you know that I will be unavailable for sessions during
        the following period:
      </Text>

      <Section style={warningBox}>
        <Text style={{ margin: "0 0 8px 0" }}>
          <strong>Dates:</strong> {startStr} - {endStr}
        </Text>
        <Text style={{ margin: 0 }}>
          <strong>Reason:</strong> {data.reason}
        </Text>
      </Section>

      <Section style={successBox}>
        <Text style={{ margin: 0 }}>
          <strong>Good news:</strong> {data.bonusDays} bonus day
          {plural ? "s" : ""} ha{plural ? "ve" : "s"} been added to your
          subscription to make up for this time.
        </Text>
      </Section>

      <Text>
        If you had any sessions booked during this time, they have been
        cancelled and your session credits have been restored.
      </Text>

      <Text>Thank you for your understanding!</Text>
    </EmailLayout>
  )
}

export async function mentorBlockNoticeEmail(data: MentorBlockNoticeData) {
  const startStr = format(data.startDate, "EEEE, MMMM d")
  const endStr = format(data.endDate, "EEEE, MMMM d, yyyy")

  return {
    subject: `Mentor unavailable ${startStr} - ${endStr}`,
    html: await render(<MentorBlockNoticeEmail {...data} />),
  }
}

const heading = {
  color: "#cdd6f4",
  marginBottom: "24px",
}

const warningBox = {
  background: "#313244",
  border: "1px solid #f9e2af",
  borderRadius: "4px",
  padding: "16px",
  margin: "24px 0",
}

const successBox = {
  background: "#313244",
  border: "1px solid #a6e3a1",
  borderRadius: "4px",
  padding: "16px",
  margin: "24px 0",
}
