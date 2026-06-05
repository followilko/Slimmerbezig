import type { Metadata } from "next"
import { Inter_Tight } from "next/font/google"

import "./globals.css"
import { Providers } from "./providers"

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Slimmerbezig",
  description: "Sign in with LinkedIn and keep your profile in Supabase.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={interTight.variable}
      suppressHydrationWarning
    >
      <body
        className={`${interTight.className} flex min-h-screen flex-col bg-background font-sans text-base antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
