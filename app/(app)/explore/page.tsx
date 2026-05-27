import { EmptyStateCard } from "@/components/shell/empty-state"
import { PageHeader, PageShell } from "@/components/shell/page-header"
import { requireOnboarded } from "@/lib/auth/onboarding"
import { getViewer } from "@/lib/profile/get-viewer-profile"

export default async function ExplorePage() {
  const viewer = await getViewer()
  requireOnboarded(viewer?.profile ?? null)

  return (
    <PageShell>
      <PageHeader
        title="Explore"
        description="Ontdek hacks van professionals bij andere organisaties."
      />
      <EmptyStateCard
        title="Cross-org discovery komt eraan"
        description="Hier vind je straks publieke hacks van mensen in jouw vakgebied bij andere bedrijven. Vult zich als de community groeit."
      />
    </PageShell>
  )
}
