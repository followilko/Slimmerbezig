import { BrandMark } from "@/components/shell/brand-mark"
import { PrimaryNav } from "@/components/shell/primary-nav"
import { SecondaryMenu } from "@/components/shell/secondary-menu"
import type { ViewerProfile } from "@/lib/profile/get-viewer-profile"

export function AppHeader({
  profile,
  savedCount,
  pointsCount,
}: {
  profile: ViewerProfile | null
  savedCount: number
  pointsCount: number
}) {
  return (
    <header className="sticky top-0 z-40 bg-zinc-50/90 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-zinc-50/70 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BrandMark />
          <PrimaryNav />
        </div>
        <SecondaryMenu
          profile={profile}
          savedCount={savedCount}
          pointsCount={pointsCount}
        />
      </div>
    </header>
  )
}
