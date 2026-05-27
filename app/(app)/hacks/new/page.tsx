import { redirect } from "next/navigation"

import { EmptyStateCard } from "@/components/shell/empty-state"
import { PageHeader, PageShell } from "@/components/shell/page-header"
import { requireOnboarded } from "@/lib/auth/onboarding"
import { isCreator } from "@/lib/auth/role"
import { getViewer } from "@/lib/profile/get-viewer-profile"

export default async function CreateHackPage() {
  const viewer = await getViewer()
  requireOnboarded(viewer?.profile ?? null)

  if (!isCreator(viewer?.profile ?? null)) {
    redirect("/become-a-creator")
  }

  return (
    <PageShell>
      <PageHeader
        title="Create a new hack"
        description="Deel een korte tip, recept of long-form guide."
      />
      <EmptyStateCard
        title="Hack-editor komt eraan"
        description="De compose-flow (bite / recipe / guide met Goal × Tool × Capability) wordt gebouwd. Voor nu kun je hacks rechtstreeks in Supabase Table Editor maken."
      />
    </PageShell>
  )
}
