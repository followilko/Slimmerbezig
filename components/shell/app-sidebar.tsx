import { Wind } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

import { CreateMenu } from "@/components/shell/create-menu"
import { MembershipList } from "@/components/shell/membership-list"
import { SidebarChannelSearch } from "@/components/shell/sidebar-channel-search"
import { SidebarNav } from "@/components/shell/sidebar-nav"
import { SidebarUser } from "@/components/shell/sidebar-user"
import type { ChannelOverview } from "@/lib/channels/queries"
import type { ViewerProfile } from "@/lib/profile/get-viewer-profile"
import { cn } from "@/lib/utils"

export function AppSidebar({
  profile,
  savedCount,
  pointsCount,
  canCreateHacks,
  canCreateChannels,
  memberships,
  className,
}: {
  profile: ViewerProfile | null
  savedCount: number
  pointsCount: number
  canCreateHacks: boolean
  canCreateChannels: boolean
  memberships: ChannelOverview[]
  className?: string
}) {
  return (
    <aside
      className={cn(
        // sticky + h-100dvh (not fixed): a transformed ancestor (app/template
        // GSAP) becomes the containing block for `fixed`, which stretched this
        // to the page height. self-start stops flex `stretch` from doing the same.
        "sticky top-0 z-40 hidden h-[100dvh] w-64 shrink-0 flex-col self-start border-r border-border bg-white md:flex",
        className
      )}
    >
      <div className="flex items-center gap-2 px-5 py-4">
        <Link
          href="/for-you"
          aria-label="Slimmerbezig home"
          className="inline-flex items-center gap-2 font-heading text-base font-semibold tracking-tight"
        >
          <span className="inline-flex size-7 items-center justify-center rounded-full border border-black/10 bg-white">
            <Wind className="size-4" strokeWidth={2.25} />
          </span>
          Slimmerbezig
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pb-3">
        <SidebarNav />

        <SidebarChannelSearch />

        <MembershipList channels={memberships} />
      </div>

      <div className="flex flex-col gap-3 px-3 py-3">
        {canCreateHacks ? (
          <Suspense fallback={null}>
            <CreateMenu canCreateChannels={canCreateChannels} variant="block" />
          </Suspense>
        ) : null}

        <SidebarUser
          profile={profile}
          savedCount={savedCount}
          pointsCount={pointsCount}
        />
      </div>
    </aside>
  )
}
