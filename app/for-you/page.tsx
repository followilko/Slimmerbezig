import Link from "next/link"
import { redirect } from "next/navigation"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server"
import {
  HackCardActions,
  type HackReactions,
} from "@/components/feed/hack-card-actions"
import { HackViewTracker } from "@/components/feed/hack-view-tracker"

function Pill({
  children,
  variant = "outline",
}: {
  children: React.ReactNode
  variant?: "outline" | "secondary"
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        variant === "outline"
          ? "border-border text-muted-foreground"
          : "border-transparent bg-secondary text-secondary-foreground"
      )}
    >
      {children}
    </span>
  )
}

type HackRow = {
  id: string
  title: string
  summary: string | null
  source: string
  status: string
  created_at: string
}

type InteractionRow = {
  hack_id: string
  kind: "saved" | "viewed" | "completed" | "helpful" | "not_helpful"
}

function reactionsFor(
  hackId: string,
  byHack: Map<string, Set<InteractionRow["kind"]>>
): HackReactions {
  const kinds = byHack.get(hackId)
  return {
    helpful: Boolean(kinds?.has("helpful")),
    notHelpful: Boolean(kinds?.has("not_helpful")),
    saved: Boolean(kinds?.has("saved")),
  }
}

export default async function ForYouPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("given_name, full_name, sector, onboarded_at")
    .eq("id", user.id)
    .maybeSingle<{
      given_name: string | null
      full_name: string | null
      sector: string | null
      onboarded_at: string | null
    }>()

  if (!profile?.onboarded_at) {
    redirect("/onboarding")
  }

  const givenName =
    profile?.given_name ?? profile?.full_name?.split(" ")[0]?.trim() ?? null

  const [recsRes, understandingRes] = await Promise.all([
    supabase.rpc("get_recommended_hacks", { p_limit: 20 }),
    supabase
      .from("profile_understanding")
      .select("summary")
      .eq("user_id", user.id)
      .maybeSingle<{ summary: string | null }>(),
  ])

  const hacks = (recsRes.data ?? []) as HackRow[]
  const summary = understandingRes.data?.summary ?? null

  const interactionMap = new Map<string, Set<InteractionRow["kind"]>>()
  if (hacks.length > 0) {
    const hackIds = hacks.map((h) => h.id)
    const { data: interactions } = await supabase
      .from("hack_interactions")
      .select("hack_id, kind")
      .eq("user_id", user.id)
      .in("hack_id", hackIds)
      .in("kind", ["helpful", "not_helpful", "saved", "viewed"])
      .returns<InteractionRow[]>()
    for (const row of interactions ?? []) {
      const set = interactionMap.get(row.hack_id) ?? new Set()
      set.add(row.kind)
      interactionMap.set(row.hack_id, set)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            For You{givenName ? `, ${givenName}` : ""}
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Hacks afgestemd op je sector, frustraties en tools. Markeer wat
            werkt — je feed leert ervan. Meer feeds (Popular, Office peers)
            komen er nog aan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {profile.sector ? (
            <Pill variant="secondary">{profile.sector}</Pill>
          ) : null}
          <Link
            href="/onboarding"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Update profile
          </Link>
          <Link
            href="/checkin"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Weekly check-in
          </Link>
        </div>
      </div>

      {summary ? (
        <Card className="mx-auto w-full max-w-5xl">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Wat we van je weten
            </CardTitle>
            <CardDescription>
              Rolling samenvatting (privé, alleen jij ziet hem).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{summary}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="mx-auto w-full max-w-5xl">
        {hacks.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hacks.map((h) => (
              <HackCard
                key={h.id}
                hack={h}
                reactions={reactionsFor(h.id, interactionMap)}
                alreadyViewed={Boolean(interactionMap.get(h.id)?.has("viewed"))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function HackCard({
  hack,
  reactions,
  alreadyViewed,
}: {
  hack: HackRow
  reactions: HackReactions
  alreadyViewed: boolean
}) {
  return (
    <Card className="relative h-full transition-shadow hover:shadow-md">
      <HackViewTracker hackId={hack.id} alreadyViewed={alreadyViewed} />
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/hacks/${hack.id}`}
            className="relative z-10 flex-1 focus-visible:outline-none"
          >
            <CardTitle className="line-clamp-2 hover:underline">
              {hack.title}
            </CardTitle>
          </Link>
          <Pill>{hack.source}</Pill>
        </div>
      </CardHeader>
      {hack.summary ? (
        <CardContent>
          <Link href={`/hacks/${hack.id}`} className="relative z-10 block">
            <p className="text-muted-foreground line-clamp-4 text-sm">
              {hack.summary}
            </p>
          </Link>
        </CardContent>
      ) : null}
      <CardFooter className="relative z-10">
        <HackCardActions hackId={hack.id} initial={reactions} />
      </CardFooter>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nog geen hacks voor je</CardTitle>
        <CardDescription>
          Er staat nog weinig content die matcht met je sector + frustraties +
          tools. Twee dingen die helpen:
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <p>
          1. Voeg meer signalen toe — een{" "}
          <Link href="/onboarding" className="font-medium underline">
            extra frustratie
          </Link>{" "}
          of een tool die je nog niet noemde.
        </p>
        <p>
          2. Doe een{" "}
          <Link href="/checkin" className="font-medium underline">
            weekly check-in
          </Link>{" "}
          — dat geeft de aanbevelingen meer context per week.
        </p>
      </CardContent>
    </Card>
  )
}
