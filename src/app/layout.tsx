import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { SessionProvider } from "@/components/auth/session-provider"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
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
  title: "keogami's mentorship | 1:1 programming sessions",
  description:
    "Personal 1:1 programming mentorship. Book daily sessions, get unstuck faster, build real projects.",
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
