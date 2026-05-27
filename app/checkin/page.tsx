import Link from "next/link"
import { redirect } from "next/navigation"

import { CoachChat } from "@/components/ai/coach-chat"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server"

export default async function CheckinPage() {
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
            Weekly check-in
          </h1>
          <p className="text-muted-foreground max-w-xl text-sm">
            Quick reflection on what consumed your week. We reuse your evolving
            context for better recommendations next time you open Slimmerbezig.
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
        apiPath="/api/onboarding/chat?kind=checkin"
        title="Coach — check-in mode"
      />
    </div>
  )
}
