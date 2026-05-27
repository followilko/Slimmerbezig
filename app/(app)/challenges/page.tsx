import { EmptyStateCard } from "@/components/shell/empty-state"
import { PageHeader, PageShell } from "@/components/shell/page-header"
import { requireOnboarded } from "@/lib/auth/onboarding"
import { getViewer } from "@/lib/profile/get-viewer-profile"

export default async function ChallengesPage() {
  const viewer = await getViewer()
  requireOnboarded(viewer?.profile ?? null)

  return (
    <PageShell>
      <PageHeader
        title="Challenges"
        description="Vraag de community om hulp bij een concreet werkprobleem."
      />
      <EmptyStateCard
        title="Challenges-feed wordt opgebouwd"
        description="Binnenkort kun je hier een vraag posten en krijg je antwoorden van peers — in tekst of via gedeelde hacks."
      />
    </PageShell>
  )
}
