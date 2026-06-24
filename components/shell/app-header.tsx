import { PrimaryNav } from "@/components/shell/primary-nav"
import { SecondaryMenu } from "@/components/shell/secondary-menu"
import type { ViewerProfile } from "@/lib/profile/get-viewer-profile"

export function AppHeader({
  profile,
  savedCount,
  pointsCount,
  canCreateHacks,
}: {
  profile: ViewerProfile | null
  savedCount: number
  pointsCount: number
  canCreateHacks: boolean
}) {
  return (
    <header className="sticky top-0 z-40 px-4 py-3 sm:px-6">
      <div className="flex w-full items-center justify-between gap-4">
        <PrimaryNav />
        <SecondaryMenu
          profile={profile}
          savedCount={savedCount}
          pointsCount={pointsCount}
          canCreateHacks={canCreateHacks}
        />
      </div>
    </header>
  )
}
