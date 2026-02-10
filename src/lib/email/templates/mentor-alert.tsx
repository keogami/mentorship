import { Heading, Row, Section, Text } from "@react-email/components"
import { render } from "@react-email/render"
import { EmailLayout } from "./_layout"

export type MentorAlertData = {
  title: string
  message: string
  details?: Record<string, string>
}

function MentorAlertEmail(data: MentorAlertData) {
  return (
    <EmailLayout
      preview={`[Alert] ${data.title}`}
      footer={
        <Text style={footerText}>
          This is an automated alert from keogami&apos;s mentorship. Check Vercel logs for more
          context.
        </Text>
      }
    >
      <Heading as="h1" style={heading}>
        Alert: {data.title}
      </Heading>

      <Section style={alertBox}>
        <Text style={{ margin: 0, color: "#f38ba8" }}>{data.message}</Text>
      </Section>

      {data.details && (
        <table style={table}>
          <tbody>
            {Object.entries(data.details).map(([key, value]) => (
              <Row key={key}>
                <td style={labelCell}>{key}</td>
                <td style={valueCell}>{value}</td>
              </Row>
            ))}
          </tbody>
        </table>
      )}
    </EmailLayout>
  )
}

export async function mentorAlertEmail(data: MentorAlertData) {
  return {
    subject: `[Alert] ${data.title}`,
    html: await render(<MentorAlertEmail {...data} />),
  }
}

const heading = {
  color: "#cdd6f4",
  marginBottom: "24px",
}

const alertBox = {
  background: "#45475a",
  border: "1px solid #f38ba8",
  borderRadius: "4px",
  padding: "16px",
  margin: "24px 0",
}

const table = {
  width: "100%" as const,
  borderCollapse: "collapse" as const,
  margin: "16px 0",
}

const labelCell = {
  padding: "8px 12px",
  border: "1px solid #45475a",
  fontWeight: "bold" as const,
  background: "#313244",
  whiteSpace: "nowrap" as const,
}

const valueCell = {
  padding: "8px 12px",
  border: "1px solid #45475a",
  fontFamily: "monospace",
}

const footerText = {
  color: "#a6adc8",
  fontSize: "14px",
}
