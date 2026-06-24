import { Bookmark, Flame } from "lucide-react"
import Link from "next/link"

import { HamburgerMenu } from "@/components/shell/hamburger-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { isCreator as isCreatorRole } from "@/lib/auth/role"
import {
  displayNameFor,
  initialsFor,
  type ViewerProfile,
} from "@/lib/profile/get-viewer-profile"
import { cn } from "@/lib/utils"

export function SidebarUser({
  profile,
  savedCount,
  pointsCount,
}: {
  profile: ViewerProfile | null
  savedCount: number
  pointsCount: number
}) {
  const isCreator = isCreatorRole(profile)
  const displayName = displayNameFor(profile)
  const avatarUrl = profile?.avatar_url?.trim()
  const badge =
    savedCount > 99 ? "99+" : savedCount > 0 ? String(savedCount) : null

  return (
    <div className="flex items-center gap-2 border-t border-border pt-3">
      <Link
        href="/profile"
        className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-foreground/5"
        aria-label={displayName ? `${displayName} — profiel` : "Profiel"}
      >
        <Avatar className="size-8">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={displayName ?? "Avatar"} />
          ) : null}
          <AvatarFallback className="text-xs">
            {initialsFor(profile)}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {displayName ?? "Profiel"}
        </span>
        {isCreator ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
            <Flame className="size-3 text-amber-600" />
            {pointsCount}
          </span>
        ) : null}
      </Link>

      <Link
        href="/saved"
        aria-label={savedCount > 0 ? `${savedCount} opgeslagen` : "Opgeslagen"}
        className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
      >
        <Bookmark
          className={cn(
            "size-4",
            savedCount > 0 ? "fill-current text-foreground" : ""
          )}
        />
        {badge ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background">
            {badge}
          </span>
        ) : null}
      </Link>

      <div className="shrink-0 text-muted-foreground [&_button]:text-muted-foreground [&_button]:hover:bg-foreground/5 [&_button]:hover:text-foreground">
        <HamburgerMenu isCreator={isCreator} />
      </div>
    </div>
  )
}
