import { Heading, Section, Text } from "@react-email/components"
import { render } from "@react-email/render"
import { EmailLayout } from "./_layout"

export type SubscriptionActivatedData = {
  userName: string
  planName: string
  sessionsPerPeriod: number
  period: "weekly" | "monthly"
}

function SubscriptionActivatedEmail(data: SubscriptionActivatedData) {
  const periodLabel = data.period === "weekly" ? "week" : "month"

  return (
    <EmailLayout preview={`Your ${data.planName} plan is now active`}>
      <Heading as="h1" style={heading}>
        Welcome to keogami&apos;s mentorship!
      </Heading>

      <Text>Hi {data.userName},</Text>

      <Text>
        Your <strong>{data.planName}</strong> subscription is now active. You
        have <strong>{data.sessionsPerPeriod} sessions</strong> available this{" "}
        {periodLabel}.
      </Text>

      <Section style={infoBox}>
        <Text style={{ margin: "0 0 8px 0" }}>
          <strong>Next steps:</strong>
        </Text>
        <ul style={{ margin: 0, paddingLeft: "20px" }}>
          <li>Book your first session from your dashboard</li>
          <li>Sessions are 50 minutes each</li>
          <li>Cancel with at least 4 hours notice to get your session back</li>
        </ul>
      </Section>

      <Text>Looking forward to our sessions together!</Text>
    </EmailLayout>
  )
}

export async function subscriptionActivatedEmail(data: SubscriptionActivatedData) {
  return {
    subject: `Welcome to keogami's mentorship - Your ${data.planName} plan is now active`,
    html: await render(<SubscriptionActivatedEmail {...data} />),
  }
}

const heading = {
  color: "#cdd6f4",
  marginBottom: "24px",
}

const infoBox = {
  background: "#313244",
  borderRadius: "4px",
  padding: "16px",
  margin: "24px 0",
}
