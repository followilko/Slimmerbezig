import { Bookmark, Flame } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CreateMenu } from "@/components/shell/create-menu"
import { HamburgerMenu } from "@/components/shell/hamburger-menu"
import { HeaderSearch } from "@/components/shell/header-search"
import { isCreator as isCreatorRole } from "@/lib/auth/role"
import {
  displayNameFor,
  initialsFor,
  type ViewerProfile,
} from "@/lib/profile/get-viewer-profile"
import { cn } from "@/lib/utils"

const FAVORITES_HREF = "/saved"
const PROFILE_HREF = "/profile"

export function SecondaryMenu({
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
  const isCreator = isCreatorRole(profile)
  const badge = savedCount > 99 ? "99+" : savedCount > 0 ? String(savedCount) : null
  const displayName = displayNameFor(profile)
  const avatarUrl = profile?.avatar_url?.trim()

  return (
    <div className="glass-bg flex h-[3.75rem] items-center gap-2 rounded-full px-[1em]">
      {canCreateHacks ? (
        <Suspense fallback={null}>
          <CreateMenu />
        </Suspense>
      ) : null}

      <HeaderSearch />

      <Link
        href={FAVORITES_HREF}
        aria-label={
          savedCount > 0 ? `${savedCount} saved posts` : "Saved posts"
        }
        className="relative inline-flex size-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
      >
        <Bookmark
          className={cn(
            "size-4",
            savedCount > 0 ? "fill-current text-white" : "text-white"
          )}
        />
        {badge ? (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background ring-2 ring-white">
            {badge}
          </span>
        ) : null}
      </Link>

      {isCreator ? (
        <Link
          href="/profile"
          title="Punten-ledger komt later"
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-amber-100 px-3 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-200"
        >
          <Flame className="size-3.5 text-amber-600" />
          {pointsCount}
        </Link>
      ) : null}

      <Link
        href={PROFILE_HREF}
        aria-label={displayName ? `${displayName} — profile` : "Profile"}
        className="inline-flex"
      >
        <Avatar className="size-8">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={displayName ?? "Avatar"} />
          ) : null}
          <AvatarFallback className="text-xs">
            {initialsFor(profile)}
          </AvatarFallback>
        </Avatar>
      </Link>

      <HamburgerMenu isCreator={isCreator} />
    </div>
  )
}
