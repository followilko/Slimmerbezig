import { redirect } from "next/navigation"

import {
  COMPOSE_HACK,
  COMPOSE_PARAM,
} from "@/components/post/post-maker/compose-param"
import { requireOnboarded } from "@/lib/auth/onboarding"
import { getViewerCapabilities } from "@/lib/levels"
import { getViewer } from "@/lib/profile/get-viewer-profile"

/**
 * Linkable entry point for the hack composer. The composer itself is the
 * globally-mounted <PostMakerModal /> (opened via the `?compose=hack` param),
 * so this route just gates on capability and opens it over the feed.
 */
export default async function CreateHackPage() {
  const viewer = await getViewer()
  requireOnboarded(viewer?.profile ?? null)

  const capabilities = await getViewerCapabilities(
    viewer!.userId,
    viewer?.profile ?? null
  )

  if (!capabilities.canCreateHacks) {
    redirect("/become-a-creator")
  }

  redirect(`/for-you?${COMPOSE_PARAM}=${COMPOSE_HACK}`)
}
