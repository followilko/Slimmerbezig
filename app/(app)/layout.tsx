import { Suspense } from "react"
import { redirect } from "next/navigation"

import { PostMakerModal } from "@/components/post/post-maker/post-maker-modal"
import { AppHeader } from "@/components/shell/app-header"
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

  const [savedCount, capabilities] = await Promise.all([
    getSavedCount(viewer.userId),
    getViewerCapabilities(viewer.userId, viewer.profile),
  ])

  return (
    <div id="app-shell" className="flex min-h-screen flex-col bg-zinc-50">
      <AppHeader
        profile={viewer.profile}
        savedCount={savedCount}
        pointsCount={capabilities.xp}
        canCreateHacks={capabilities.canCreateHacks}
      />
      <main className="flex w-full flex-1 flex-col pb-32">{children}</main>

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
