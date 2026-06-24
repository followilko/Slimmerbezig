"use client"

import { ThemeProvider } from "next-themes"
import { Suspense } from "react"

import { SmoothScrollProvider } from "@/components/anim/SmoothScrollProvider"
import { AskBar } from "@/components/feed/ask-bar"
import { Toaster } from "@/components/ui/sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      forcedTheme="light"
      disableTransitionOnChange
    >
      <SmoothScrollProvider>{children}</SmoothScrollProvider>
      <Suspense fallback={null}>
        <AskBar />
      </Suspense>
      <Toaster />
    </ThemeProvider>
  )
}
