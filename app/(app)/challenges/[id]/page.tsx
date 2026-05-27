import Link from "next/link"
import { notFound } from "next/navigation"

import { EmptyStateCard } from "@/components/shell/empty-state"
import { PageHeader, PageShell } from "@/components/shell/page-header"
import { buttonVariants } from "@/components/ui/button"
import { requireOnboarded } from "@/lib/auth/onboarding"
import { displayNameFor, getViewer } from "@/lib/profile/get-viewer-profile"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

type ChallengeDetail = {
  id: string
  title: string
  body: string | null
  status: string
  created_at: string
  user_id: string
}

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const viewer = await getViewer()
  requireOnboarded(viewer?.profile ?? null)

  const { id } = await params
  const supabase = await createClient()
  const userId = viewer!.userId

  const { data: challenge, error } = await supabase
    .from("challenges")
    .select("id, title, body, status, created_at, user_id")
    .eq("id", id)
    .maybeSingle<ChallengeDetail>()

  if (error || !challenge) {
    notFound()
  }

  const { data: tagLinks } = await supabase
    .from("challenge_tags")
    .select("tags(slug, label)")
    .eq("challenge_id", id)

  type TagRow = { slug: string; label: string }
  const tags: TagRow[] = []
  for (const row of tagLinks ?? []) {
    const raw = row.tags as TagRow | TagRow[] | null
    if (!raw) continue
    if (Array.isArray(raw)) {
      tags.push(...raw.filter((t) => t?.slug && t?.label))
    } else if (raw.slug && raw.label) {
      tags.push(raw)
    }
  }

  let authorLabel = "Peer"
  if (challenge.user_id === userId) {
    authorLabel = "Jij"
  } else {
    const { data: author } = await supabase
      .from("profiles")
      .select("full_name, given_name, family_name")
      .eq("id", challenge.user_id)
      .maybeSingle()

    authorLabel = displayNameFor(author as Parameters<typeof displayNameFor>[0]) ?? "Peer"
  }

  const createdLabel = new Date(challenge.created_at).toLocaleDateString(
    "nl-NL",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  )

  return (
    <PageShell>
      <PageHeader title={challenge.title}>
        <Link
          href="/challenges"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          ← Alle challenges
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span
            className={cn(
              "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
              challenge.status === "open"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-border bg-muted text-muted-foreground"
            )}
          >
            {challenge.status === "open"
              ? "Open"
              : challenge.status === "resolved"
                ? "Opgelost"
                : challenge.status}
          </span>
          <span>
            {authorLabel} · {createdLabel}
          </span>
        </div>

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag.slug}
                className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
              >
                {tag.label}
              </span>
            ))}
          </div>
        ) : null}

        {challenge.body ? (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {challenge.body}
          </div>
        ) : null}

        <EmptyStateCard
          title="Antwoorden komen binnenkort"
          description="Comments en hack-links op challenges worden toegevoegd in een volgende release. Je vraag staat al wel open voor peers."
        />
      </div>
    </PageShell>
  )
}
