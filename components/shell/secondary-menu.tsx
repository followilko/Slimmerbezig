import { Flame, Heart, Plus, Sparkles } from "lucide-react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HamburgerMenu } from "@/components/shell/hamburger-menu"
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
}: {
  profile: ViewerProfile | null
  savedCount: number
  pointsCount: number
}) {
  const isCreator = isCreatorRole(profile)
  const createHref = isCreator ? "/hacks/new" : "/become-a-creator"
  const createLabel = isCreator ? "Create" : "Become a creator"
  const createIcon = isCreator ? <Plus className="size-4" /> : <Sparkles className="size-4" />
  const badge = savedCount > 99 ? "99+" : savedCount > 0 ? String(savedCount) : null
  const displayName = displayNameFor(profile)
  const avatarUrl = profile?.avatar_url?.trim()

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-white p-1.5 shadow-sm">
      <Link
        href={createHref}
        aria-label={createLabel}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-xs font-semibold text-background transition-opacity hover:opacity-90"
        )}
      >
        {createIcon}
        <span className="hidden sm:inline">{createLabel}</span>
      </Link>

      <span aria-hidden className="mx-1 hidden h-5 w-px bg-border sm:block" />

      <Link
        href={FAVORITES_HREF}
        aria-label={
          savedCount > 0 ? `${savedCount} saved posts` : "Saved posts"
        }
        className={cn(
          "relative inline-flex size-8 items-center justify-center rounded-full transition-colors",
          savedCount > 0
            ? "bg-favorite text-favorite-foreground hover:bg-favorite/90"
            : "bg-muted text-foreground hover:bg-muted/80"
        )}
      >
        <Heart className={cn("size-4", savedCount > 0 && "fill-current")} />
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
