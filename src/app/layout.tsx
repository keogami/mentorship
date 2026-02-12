import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { SessionProvider } from "@/components/auth/session-provider"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SITE_CONFIG } from "@/lib/constants"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: "keogami's mentorship | 1:1 programming sessions",
    template: "%s | keogami's mentorship",
  },
  description:
    "Personal 1:1 programming mentorship. Book daily sessions, get unstuck faster, build real projects.",
  openGraph: {
    type: "website",
    siteName: SITE_CONFIG.name,
    title: "keogami's mentorship | 1:1 programming sessions",
    description:
      "Personal 1:1 programming mentorship. Book daily sessions, get unstuck faster, build real projects.",
    url: SITE_CONFIG.url,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "keogami's mentorship | 1:1 programming sessions",
    description:
      "Personal 1:1 programming mentorship. Book daily sessions, get unstuck faster, build real projects.",
  },
  icons: {
    icon: "/icon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-mono antialiased`}
      >
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              <Header />
              <main>{children}</main>
              <Footer />
            </TooltipProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
