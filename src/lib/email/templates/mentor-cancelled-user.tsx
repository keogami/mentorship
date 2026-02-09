import { Heading, Section, Text } from "@react-email/components"
import { render } from "@react-email/render"
import { EmailLayout } from "./_layout"

export type MentorCancelledUserData = {
  userName: string
  reason: string
  refundAmount: number
}

function formatPrice(priceInr: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(priceInr)
}

function MentorCancelledUserEmail(data: MentorCancelledUserData) {
  const hasRefund = data.refundAmount > 0

  return (
    <EmailLayout
      preview="Your Mentorship subscription has been terminated"
      footer={
        <Text style={footerText}>This email was sent from Mentorship.</Text>
      }
    >
      <Heading as="h1" style={heading}>
        Subscription Terminated
      </Heading>

      <Text>Hi {data.userName},</Text>

      <Text>
        Your Mentorship subscription has been terminated by the mentor.
      </Text>

      <Section style={dangerBox}>
        <Text style={{ margin: 0 }}>
          <strong>Reason:</strong> {data.reason}
        </Text>
      </Section>

      {hasRefund && (
        <Section style={successBox}>
          <Text style={{ margin: 0 }}>
            A pro-rata refund of{" "}
            <strong>{formatPrice(data.refundAmount)}</strong> has been issued to
            your payment method. It may take 5-7 business days to appear.
          </Text>
        </Section>
      )}

      <Text>Any scheduled sessions have been cancelled.</Text>
    </EmailLayout>
  )
}

export async function mentorCancelledUserEmail(data: MentorCancelledUserData) {
  return {
    subject: "Your Mentorship subscription has been terminated",
    html: await render(<MentorCancelledUserEmail {...data} />),
  }
}

const heading = {
  color: "#111",
  marginBottom: "24px",
}

const dangerBox = {
  background: "#f8d7da",
  border: "1px solid #f5c6cb",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
}

const successBox = {
  background: "#d4edda",
  border: "1px solid #28a745",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
}

const footerText = {
  color: "#666",
  fontSize: "14px",
}
