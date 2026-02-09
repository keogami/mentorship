import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components"
import type { ReactNode } from "react"

type EmailLayoutProps = {
  children: ReactNode
  preview?: string
  footer?: ReactNode
}

export function EmailLayout({ children, preview, footer }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Body style={body}>
        <Container style={container}>
          {children}
          <Hr style={hr} />
          {footer ?? (
            <Text style={footerText}>
              This email was sent from Mentorship. If you have any questions, contact keogami.
            </Text>
          )}
        </Container>
      </Body>
    </Html>
  )
}

const body = {
  fontFamily: "system-ui, -apple-system, sans-serif",
  lineHeight: "1.6",
  color: "#333",
}

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "20px",
}

const hr = {
  border: "none",
  borderTop: "1px solid #eee",
  margin: "32px 0",
}

const footerText = {
  color: "#666",
  fontSize: "14px",
}
