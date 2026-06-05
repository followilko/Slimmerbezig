import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from "@/components/ui/avatar"
import type { Post } from "@/lib/dummy/posts"

import { formatPeerCompletionText } from "../post-peer-footer"

function initialsFor(name: string): string {
  return name.charAt(0)?.toUpperCase() ?? "?"
}

/** Social proof chip — floats below the card shell, outside brand background. */
export function PostPeerStrip({ post }: { post: Post }) {
  const text = formatPeerCompletionText(
    post.completedByPeers,
    post.totalPeerCompletions
  )
  if (!text) return null

  const avatars = post.completedByPeers.slice(0, 3)

  return (
    <div className="pointer-events-none absolute top-full right-0 left-0 z-10 mt-2 flex justify-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
        <AvatarGroup>
          {avatars.map((peer) => (
            <Avatar key={peer.name} size="sm" className="size-6">
              {peer.avatarUrl ? (
                <AvatarImage src={peer.avatarUrl} alt={peer.name} />
              ) : null}
              <AvatarFallback className="text-[10px]">
                {initialsFor(peer.name)}
              </AvatarFallback>
            </Avatar>
          ))}
        </AvatarGroup>
        <span>{text}</span>
      </div>
    </div>
  )
}
