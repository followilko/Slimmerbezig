import { EmptyStateCard } from "@/components/shell/empty-state"
import { PageHeader, PageShell } from "@/components/shell/page-header"
import { requireOnboarded } from "@/lib/auth/onboarding"
import {
  getSavedCount,
  getViewer,
} from "@/lib/profile/get-viewer-profile"

export default async function SavedPage() {
  const viewer = await getViewer()
  requireOnboarded(viewer?.profile ?? null)

  const count = await getSavedCount(viewer!.userId)

  return (
    <PageShell>
      <PageHeader
        title="Saved"
        description={
          count > 0
            ? `Je hebt ${count} hack${count === 1 ? "" : "s"} opgeslagen.`
            : "Hacks die je opslaat verschijnen hier."
        }
      />
      <EmptyStateCard
        title="Saved-feed komt eraan"
        description="Het overzicht van je opgeslagen hacks krijgt straks z'n eigen grid — voor nu zie je hier de teller in de header."
      />
    </PageShell>
  )
}
