import { BrandMark } from "@/components/shell/brand-mark"
import { PrimaryNav } from "@/components/shell/primary-nav"
import { ProgressiveBlur } from "@/components/shell/progressive-blur"
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
    <header className="sticky top-0 z-40 relative px-4 py-3 sm:px-6">
      <ProgressiveBlur />
      <div className="relative z-10 flex w-full items-center justify-between gap-4">
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
