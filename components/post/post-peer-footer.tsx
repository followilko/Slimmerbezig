import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from "@/components/ui/avatar"
import type { Post } from "@/lib/dummy/posts"

function initialsFor(name: string): string {
  return name.charAt(0)?.toUpperCase() ?? "?"
}

export function formatPeerCompletionText(
  peers: Post["completedByPeers"],
  totalPeerCompletions: number
): string | null {
  if (totalPeerCompletions <= 0) return null

  const firstName = peers[0]?.name.split(/\s+/)[0] ?? "een collega"
  const others = totalPeerCompletions - 1

  if (others <= 0) {
    return `Gedaan door ${firstName}`
  }
  if (others === 1) {
    return `Gedaan door ${firstName} en 1 andere collega`
  }
  return `Gedaan door ${firstName} en ${others} andere collega's`
}

export function PostPeerFooter({ post }: { post: Post }) {
  const text = formatPeerCompletionText(
    post.completedByPeers,
    post.totalPeerCompletions
  )
  if (!text) return null

  const avatars = post.completedByPeers.slice(0, 3)

  return (
    <div className="flex justify-center pt-1">
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
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
