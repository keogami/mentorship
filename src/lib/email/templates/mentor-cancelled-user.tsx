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
      preview="Your keogami's mentorship subscription has been terminated"
      footer={
        <Text style={footerText}>This email was sent from keogami&apos;s mentorship.</Text>
      }
    >
      <Heading as="h1" style={heading}>
        Subscription Terminated
      </Heading>

      <Text>Hi {data.userName},</Text>

      <Text>
        Your keogami&apos;s mentorship subscription has been terminated by the mentor.
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
    subject: "Your keogami's mentorship subscription has been terminated",
    html: await render(<MentorCancelledUserEmail {...data} />),
  }
}

const heading = {
  color: "#cdd6f4",
  marginBottom: "24px",
}

const dangerBox = {
  background: "#45475a",
  border: "1px solid #f38ba8",
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

const footerText = {
  color: "#a6adc8",
  fontSize: "14px",
}
