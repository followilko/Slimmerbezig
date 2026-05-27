import { redirect } from "next/navigation"

import { AppHeader } from "@/components/shell/app-header"
import { getSavedCount, getViewer } from "@/lib/profile/get-viewer-profile"

export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const viewer = await getViewer()
  if (!viewer) {
    redirect("/login")
  }

  const savedCount = await getSavedCount(viewer.userId)

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <AppHeader
        profile={viewer.profile}
        savedCount={savedCount}
        pointsCount={0}
      />
      <main className="flex flex-1 flex-col pb-32">{children}</main>
    </div>
  )
}
