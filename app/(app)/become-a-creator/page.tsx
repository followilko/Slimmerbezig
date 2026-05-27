import { redirect } from "next/navigation"

import { EmptyStateCard } from "@/components/shell/empty-state"
import { PageHeader, PageShell } from "@/components/shell/page-header"
import { requireOnboarded } from "@/lib/auth/onboarding"
import { isCreator } from "@/lib/auth/role"
import { getViewer } from "@/lib/profile/get-viewer-profile"

export default async function BecomeCreatorPage() {
  const viewer = await getViewer()
  requireOnboarded(viewer?.profile ?? null)

  if (isCreator(viewer?.profile ?? null)) {
    redirect("/hacks/new")
  }

  return (
    <PageShell>
      <PageHeader
        title="Become a creator"
        description="Deel je eigen AI-hacks met de community."
      />
      <EmptyStateCard
        title="Creator-flow wordt opgezet"
        description="Voor nu promoveert een admin je handmatig naar creator in de Supabase Table Editor. Zodra dat live is verandert deze knop in 'Create new hack' in de header."
      />
    </PageShell>
  )
}
