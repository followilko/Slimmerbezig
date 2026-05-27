import { redirect } from "next/navigation"
import Link from "next/link"

import { CoachChat } from "@/components/ai/coach-chat"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server"

function buildOnboardingGreeting(args: {
  givenName: string | null
  summary: string | null
  hasOnboarded: boolean
}): string {
  const { givenName, summary, hasOnboarded } = args
  const name = givenName?.trim() || ""

  if (hasOnboarded && summary) {
    const excerpt =
      summary.length > 240 ? summary.slice(0, 237).trimEnd() + "…" : summary
    return (
      `Welkom terug${name ? `, ${name}` : ""}. Vorige keer noteerde ik: « ${excerpt} » ` +
      `Waar willen we vandaag op doorpakken — een nieuwe frustratie of een tool die je wilt toevoegen?`
    )
  }

  return (
    `Hoi${name ? ` ${name}` : ""}, ik ben de Slimmerbezig coach. ` +
    `In drie korte vragen leer ik je werk kennen, zodat je For You-feed echt voor jou wordt. ` +
    `\n\nVraag 1: vertel kort wat je doet en in welke sector je werkt — en als je wilt, plak je LinkedIn-URL erbij ` +
    `(en eventueel je headline / about-tekst, zodat ik je profiel sneller kan duiden).`
  )
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const [profileRes, understandingRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("given_name, full_name, onboarded_at")
      .eq("id", user.id)
      .maybeSingle<{
        given_name: string | null
        full_name: string | null
        onboarded_at: string | null
      }>(),
    supabase
      .from("profile_understanding")
      .select("summary")
      .eq("user_id", user.id)
      .maybeSingle<{ summary: string | null }>(),
  ])

  const givenName =
    profileRes.data?.given_name ??
    profileRes.data?.full_name?.split(" ")[0]?.trim() ??
    null
  const summary = understandingRes.data?.summary ?? null
  const hasOnboarded = Boolean(profileRes.data?.onboarded_at)

  const initialAssistantText = buildOnboardingGreeting({
    givenName,
    summary,
    hasOnboarded,
  })

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Guided onboarding
          </h1>
          <p className="text-muted-foreground max-w-xl text-sm">
            Drie korte vragen — sector, frustratie, toolkit — en je For
            You-feed wordt persoonlijk.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasOnboarded ? (
            <Link
              href="/for-you"
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
            >
              For You
            </Link>
          ) : null}
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Dashboard
          </Link>
        </div>
      </div>
      <CoachChat
        apiPath="/api/onboarding/chat"
        title="Coach"
        description="Antwoord in je eigen woorden — de assistent legt de signalen achter de schermen vast."
        initialAssistantText={initialAssistantText}
        redirectOnFinishTo="/for-you"
      />
    </div>
  )
}
