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
              This email was sent from keogami&apos;s mentorship. If you have any questions, contact keogami.
            </Text>
          )}
        </Container>
      </Body>
    </Html>
  )
}

const body = {
  fontFamily: "'Courier New', Courier, monospace",
  lineHeight: "1.6",
  color: "#cdd6f4",
  backgroundColor: "#1e1e2e",
}

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "20px",
  backgroundColor: "#181825",
  border: "1px solid #45475a",
}

const hr = {
  border: "none",
  borderTop: "1px solid #45475a",
  margin: "32px 0",
}

const footerText = {
  color: "#a6adc8",
  fontSize: "14px",
}
