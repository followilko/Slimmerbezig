import { EmptyStateCard } from "@/components/shell/empty-state"
import { PageHeader, PageShell } from "@/components/shell/page-header"
import { requireOnboarded } from "@/lib/auth/onboarding"
import { getViewer } from "@/lib/profile/get-viewer-profile"

export default async function CommunitiesPage() {
  const viewer = await getViewer()
  requireOnboarded(viewer?.profile ?? null)

  return (
    <PageShell>
      <PageHeader
        title="Communities"
        description="Clusters rond sector, tools en onderwerpen die je volgt."
      />
      <EmptyStateCard
        title="Communities komen eraan"
        description="Volg straks sectoren of tools om een gerichte feed op te bouwen — los van wat je organisatie publiceert."
      />
    </PageShell>
  )
}
