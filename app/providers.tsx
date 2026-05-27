"use client"

import { ThemeProvider } from "next-themes"

import { SmoothScrollProvider } from "@/components/anim/SmoothScrollProvider"
import { Toaster } from "@/components/ui/sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SmoothScrollProvider>{children}</SmoothScrollProvider>
      <Toaster />
    </ThemeProvider>
  )
}
