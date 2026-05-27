import Link from "next/link"

import { NewChallengeForm } from "@/app/(app)/challenges/new/new-challenge-form"
import { PageHeader, PageShell } from "@/components/shell/page-header"
import { buttonVariants } from "@/components/ui/button"
import { requireOnboarded } from "@/lib/auth/onboarding"
import { getViewer } from "@/lib/profile/get-viewer-profile"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

type SearchParams = Promise<{
  title?: string
  body?: string
  tag?: string
}>

export default async function NewChallengePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const viewer = await getViewer()
  requireOnboarded(viewer?.profile ?? null)

  const params = await searchParams
  const defaultTitle = params.title?.trim() ?? ""
  const defaultBody = params.body?.trim() ?? ""
  const defaultTagSlugs = params.tag
    ? params.tag
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : []

  const supabase = await createClient()
  const { data: tagRows } = await supabase
    .from("tags")
    .select("slug, label, kind")
    .in("kind", ["tool", "capability", "topic", "frustration"])
    .order("label")

  const tags = (tagRows ?? []).map((t) => ({
    slug: t.slug as string,
    label: t.label as string,
    kind: t.kind as string,
  }))

  return (
    <PageShell>
      <PageHeader
        title="Nieuwe challenge"
        description="Stel een concrete vraag aan je peers. Je kunt alles nog aanpassen voordat je post."
      >
        <Link
          href="/challenges"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Terug naar challenges
        </Link>
      </PageHeader>
      <NewChallengeForm
        defaultTitle={defaultTitle}
        defaultBody={defaultBody}
        defaultTagSlugs={defaultTagSlugs}
        tags={tags}
      />
    </PageShell>
  )
}
