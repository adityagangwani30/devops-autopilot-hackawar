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
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased m-0 p-0">{children}</body>
    </html>
  )
}
