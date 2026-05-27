import { EmptyStateCard } from "@/components/shell/empty-state"
import { PageHeader, PageShell } from "@/components/shell/page-header"
import { requireOnboarded } from "@/lib/auth/onboarding"
import { getViewer } from "@/lib/profile/get-viewer-profile"

export default async function OfficePeersPage() {
  const viewer = await getViewer()
  requireOnboarded(viewer?.profile ?? null)

  return (
    <PageShell>
      <PageHeader
        title="Office peers"
        description="Hacks van directe collega's binnen je organisatie."
      />
      <EmptyStateCard
        title="Nog geen Office peers feed"
        description="Deze feed wordt actief zodra je organisatie volledig is uitgerold. Hier zie je dan hacks die collega's binnen jouw bedrijf delen."
      />
    </PageShell>
  )
}
