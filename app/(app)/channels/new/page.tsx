import { redirect } from "next/navigation"

import {
  CreateChannelForm,
  type ExistingChannel,
} from "@/components/channels/create-channel-form"
import { PageHeader, PageShell } from "@/components/shell/page-header"
import { listChannels } from "@/lib/channels/queries"
import { requireOnboarded } from "@/lib/auth/onboarding"
import { getViewerCapabilities } from "@/lib/levels"
import { getViewer } from "@/lib/profile/get-viewer-profile"

export default async function NewChannelPage() {
  const viewer = await getViewer()
  requireOnboarded(viewer?.profile ?? null)

  const capabilities = await getViewerCapabilities(
    viewer!.userId,
    viewer!.profile
  )
  if (!capabilities.canCreateChannels) {
    redirect("/channels")
  }

  const all = await listChannels()
  const existing: ExistingChannel[] = all.map((c) => ({
    slug: c.slug,
    name: c.name,
    description: c.description,
  }))

  return (
    <PageShell>
      <PageHeader
        title="Nieuw kanaal"
        description="Houd het scherp: één sterk kanaal per onderwerp werkt beter dan vijf halve."
      />
      <CreateChannelForm existing={existing} />
    </PageShell>
  )
}
