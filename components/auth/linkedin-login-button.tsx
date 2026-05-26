"use client"

import { useSearchParams } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export function LinkedInLoginButton() {
  const searchParams = useSearchParams()
  const [pending, setPending] = useState(false)
  const error = searchParams.get("error")
  const next = searchParams.get("next")

  async function handleSignIn() {
    const supabase = createClient()
    const origin =
      typeof window !== "undefined" ? window.location.origin : undefined

    const nextPath =
      next && next.startsWith("/") && !next.startsWith("//")
        ? next
        : "/dashboard"

    setPending(true)
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`

    await supabase.auth.signInWithOAuth({
      provider: "linkedin_oidc",
      options: {
        redirectTo,
      },
    })
    setPending(false)
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <Button
        type="button"
        className="w-full"
        size="lg"
        disabled={pending}
        onClick={() => void handleSignIn()}
      >
        {pending ? "Redirecting…" : "Continue with LinkedIn"}
      </Button>
      {error ? (
        <p className="text-destructive text-center text-sm">
          Sign-in failed. Please try again.
        </p>
      ) : null}
    </div>
  )
}
