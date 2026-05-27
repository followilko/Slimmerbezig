import Link from "next/link"

import { EmptyStateCard } from "@/components/shell/empty-state"
import { PageHeader, PageShell } from "@/components/shell/page-header"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requireOnboarded } from "@/lib/auth/onboarding"
import { displayNameFor, getViewer } from "@/lib/profile/get-viewer-profile"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

type ChallengeRow = {
  id: string
  title: string
  body: string | null
  status: string
  created_at: string
  user_id: string
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        status === "open"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : status === "resolved"
            ? "border-border bg-muted text-muted-foreground"
            : "border-amber-200 bg-amber-50 text-amber-800"
      )}
    >
      {status === "open"
        ? "Open"
        : status === "resolved"
          ? "Opgelost"
          : status}
    </span>
  )
}

function formatRelative(iso: string): string {
  const date = new Date(iso)
  const diffMs = date.getTime() - Date.now()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  const rtf = new Intl.RelativeTimeFormat("nl", { numeric: "auto" })
  if (Math.abs(diffDays) < 1) {
    const diffHours = Math.round(diffMs / (1000 * 60 * 60))
    if (Math.abs(diffHours) < 1) {
      const diffMinutes = Math.round(diffMs / (1000 * 60))
      return rtf.format(diffMinutes, "minute")
    }
    return rtf.format(diffHours, "hour")
  }
  if (Math.abs(diffDays) < 30) {
    return rtf.format(diffDays, "day")
  }
  return date.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function ChallengeCard({
  challenge,
  meta,
}: {
  challenge: ChallengeRow
  meta?: string
}) {
  return (
    <Link href={`/challenges/${challenge.id}`} className="block">
      <Card className="transition-shadow hover:shadow-sm">
        <CardHeader className="gap-2 pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">
              {challenge.title}
            </CardTitle>
            <StatusBadge status={challenge.status} />
          </div>
          {challenge.body ? (
            <CardDescription className="line-clamp-2">
              {challenge.body}
            </CardDescription>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {meta ? `${meta} · ` : ""}
            {formatRelative(challenge.created_at)}
          </p>
        </CardHeader>
      </Card>
    </Link>
  )
}

export default async function ChallengesPage() {
  const viewer = await getViewer()
  requireOnboarded(viewer?.profile ?? null)

  const supabase = await createClient()
  const userId = viewer!.userId

  const [{ data: mine }, { data: peers }] = await Promise.all([
    supabase
      .from("challenges")
      .select("id, title, body, status, created_at, user_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("challenges")
      .select("id, title, body, status, created_at, user_id")
      .eq("status", "open")
      .neq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  const myChallenges = (mine ?? []) as ChallengeRow[]
  const peerChallenges = (peers ?? []) as ChallengeRow[]

  const peerUserIds = [...new Set(peerChallenges.map((c) => c.user_id))]
  const authorNames = new Map<string, string>()

  if (peerUserIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, given_name, family_name")
      .in("id", peerUserIds)

    for (const p of profiles ?? []) {
      const name = displayNameFor(p as Parameters<typeof displayNameFor>[0])
      if (name) authorNames.set(p.id as string, name)
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Challenges"
        description="Vraag de community om hulp bij een concreet werkprobleem."
      >
        <Link
          href="/challenges/new"
          className={cn(buttonVariants())}
        >
          Stel een challenge
        </Link>
      </PageHeader>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight">Jouw challenges</h2>
        {myChallenges.length === 0 ? (
          <EmptyStateCard
            title="Nog geen challenges"
            description="Stel een vraag wanneer je geen hack vindt — peers kunnen antwoorden met tips of gedeelde hacks."
          >
            <Link
              href="/challenges/new"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Eerste challenge plaatsen
            </Link>
          </EmptyStateCard>
        ) : (
          <div className="grid gap-3">
            {myChallenges.map((c) => (
              <ChallengeCard key={c.id} challenge={c} meta="Jij" />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight">
          Open van peers
        </h2>
        {peerChallenges.length === 0 ? (
          <EmptyStateCard
            title="Geen open challenges van peers"
            description="Zodra collega's vragen stellen, verschijnen ze hier."
          />
        ) : (
          <div className="grid gap-3">
            {peerChallenges.map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                meta={authorNames.get(c.user_id) ?? "Peer"}
              />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  )
}
