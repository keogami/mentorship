import { Heading, Section, Text } from "@react-email/components"
import { render } from "@react-email/render"
import { EmailLayout } from "./_layout"

export type SubscriptionCancelledData = {
  userName: string
  planName: string
}

function SubscriptionCancelledEmail(data: SubscriptionCancelledData) {
  return (
    <EmailLayout preview={`Your ${data.planName} subscription has been cancelled`}>
      <Heading as="h1" style={heading}>
        Subscription Cancelled
      </Heading>

      <Text>Hi {data.userName},</Text>

      <Text>
        Your <strong>{data.planName}</strong> subscription has been cancelled.
        You will no longer be charged.
      </Text>

      <Text>
        Any scheduled sessions have been cancelled. If you had unused sessions,
        they are no longer available.
      </Text>

      <Section style={infoBox}>
        <Text style={{ margin: 0 }}>
          <strong>Want to come back?</strong>
        </Text>
        <Text style={{ margin: "8px 0 0 0" }}>
          You can resubscribe anytime from the website.
        </Text>
      </Section>

      <Text>Thank you for being part of keogami&apos;s mentorship.</Text>
    </EmailLayout>
  )
}

export async function subscriptionCancelledEmail(data: SubscriptionCancelledData) {
  return {
    subject: `Your ${data.planName} subscription has been cancelled`,
    html: await render(<SubscriptionCancelledEmail {...data} />),
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
