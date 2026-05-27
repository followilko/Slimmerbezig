import { EmptyStateCard } from "@/components/shell/empty-state"
import { PageHeader, PageShell } from "@/components/shell/page-header"
import { requireOnboarded } from "@/lib/auth/onboarding"
import { getViewer } from "@/lib/profile/get-viewer-profile"

export default async function LearningPathPage() {
  const viewer = await getViewer()
  requireOnboarded(viewer?.profile ?? null)

  return (
    <PageShell>
      <PageHeader
        title="Learning path"
        description="Gecureerde reeksen hacks die op elkaar bouwen."
      />
      <EmptyStateCard
        title="Learning paths komen eraan"
        description="Curators stellen straks reeksen samen — van eerste prompt tot doorgevoerd workflow."
      />
    </PageShell>
  )
}
