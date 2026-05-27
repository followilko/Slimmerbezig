import { redirect } from "next/navigation"

import { CoachChat } from "@/components/ai/coach-chat"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Guided onboarding
          </h1>
          <p className="text-muted-foreground max-w-xl text-sm">
            Chat with Slimmerbezig Coach to capture sector, frustrations, tools,
            and AI capabilities — the signals that power your For You feed.
          </p>
        </div>
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Dashboard
        </Link>
      </div>
      <CoachChat
        apiPath="/api/onboarding/chat"
        title="Coach"
        description="Answer naturally; the assistant will structure your profile behind the scenes."
      />
    </div>
  )
}
