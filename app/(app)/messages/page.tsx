import { EmptyStateCard } from "@/components/shell/empty-state"
import { PageHeader, PageShell } from "@/components/shell/page-header"
import { requireOnboarded } from "@/lib/auth/onboarding"
import { getViewer } from "@/lib/profile/get-viewer-profile"

export default async function MessagesPage() {
  const viewer = await getViewer()
  requireOnboarded(viewer?.profile ?? null)

  return (
    <PageShell>
      <PageHeader
        title="Messages"
        description="Directe gesprekken met peers en curators."
      />
      <EmptyStateCard
        title="Messages komen eraan"
        description="Straks kun je hier 1-op-1 berichten sturen — bijvoorbeeld om een hack-auteur een vraag te stellen."
      />
    </PageShell>
  )
}
