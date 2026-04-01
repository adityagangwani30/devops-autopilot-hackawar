import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "DevOps Autopilot - Your AI CTO",
  description: "An AI agent that observes your CI/CD pipeline, reasons about failures, and acts - diagnosed in seconds, fixed with one click, never blindly risky.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased bg-[#0a0a0a] text-white">{children}</body>
    </html>
  )
}
