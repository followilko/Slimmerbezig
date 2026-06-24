import { Suspense } from "react"
import { redirect } from "next/navigation"

import { PostMakerModal } from "@/components/post/post-maker/post-maker-modal"
import { AppHeader } from "@/components/shell/app-header"
import { AppSidebar } from "@/components/shell/app-sidebar"
import { getMyChannels } from "@/lib/channels/queries"
import { getViewerCapabilities } from "@/lib/levels"
import {
  displayNameFor,
  getSavedCount,
  getViewer,
} from "@/lib/profile/get-viewer-profile"

export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const viewer = await getViewer()
  if (!viewer) {
    redirect("/login")
  }

  const [savedCount, capabilities, memberships] = await Promise.all([
    getSavedCount(viewer.userId),
    getViewerCapabilities(viewer.userId, viewer.profile),
    getMyChannels(),
  ])

  return (
    <div id="app-shell" className="flex min-h-screen bg-zinc-50">
      <AppSidebar
        profile={viewer.profile}
        savedCount={savedCount}
        pointsCount={capabilities.xp}
        canCreateHacks={capabilities.canCreateHacks}
        canCreateChannels={capabilities.canCreateChannels}
        memberships={memberships}
      />

      <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col">
        {/* Mobile-only top chrome; desktop uses the sidebar. */}
        <div className="md:hidden">
          <AppHeader
            profile={viewer.profile}
            savedCount={savedCount}
            pointsCount={capabilities.xp}
            canCreateHacks={capabilities.canCreateHacks}
          />
        </div>

        <main className="flex w-full flex-1 flex-col pb-32">{children}</main>
      </div>

      {capabilities.canCreateHacks ? (
        <Suspense fallback={null}>
          <PostMakerModal
            viewerName={displayNameFor(viewer.profile) ?? "Jij"}
            viewerAvatarUrl={viewer.profile?.avatar_url ?? null}
          />
        </Suspense>
      ) : null}
    </div>
  )
}
