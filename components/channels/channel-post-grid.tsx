import { Pin } from "lucide-react"

import { ChannelPinControl } from "@/components/channels/channel-pin-control"
import { PostCard } from "@/components/post/post-card"
import type { FeedPostItem } from "@/lib/posts/feed-items"

/**
 * Channel feed layout with the two post variants from the wireframe:
 *  - the lead post renders XL (wide) alongside a comments panel
 *  - the rest render as standard M thumbnails
 *
 * When a hack is pinned, it becomes the lead post and shows a pin badge.
 * Channel admins can pin/unpin from each card.
 */
export function ChannelPostGrid({
  items,
  slug,
  pinnedHackId,
  canAdmin,
}: {
  items: FeedPostItem[]
  slug: string
  pinnedHackId: string | null
  canAdmin: boolean
}) {
  if (items.length === 0) return null

  const [lead, ...rest] = items
  const leadPinned = pinnedHackId !== null && lead.post.id === pinnedHackId

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          {leadPinned || canAdmin ? (
            <div className="mb-2 flex items-center justify-between gap-2">
              {leadPinned ? (
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Pin className="size-3.5 fill-current" />
                  Vastgezet
                </div>
              ) : (
                <span />
              )}
              {canAdmin ? (
                <ChannelPinControl
                  slug={slug}
                  hackId={lead.post.id}
                  pinned={leadPinned}
                />
              ) : null}
            </div>
          ) : null}
          <PostCard
            post={lead.post}
            summary={lead.summary}
            saved={lead.saved}
            reactions={lead.reactions}
          />
        </div>
        <aside className="flex min-h-[12rem] flex-col rounded-[2rem] border border-dashed border-border bg-white p-5">
          <h3 className="text-sm font-semibold">Reacties</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Reacties op posts komen binnenkort beschikbaar.
          </p>
        </aside>
      </div>

      {rest.length > 0 ? (
        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {rest.map(({ post, summary, saved, reactions }) => {
            const pinned = pinnedHackId === post.id
            return (
              <div key={post.id} className="relative">
                {canAdmin ? (
                  <div className="absolute right-3 top-3 z-10">
                    <ChannelPinControl
                      slug={slug}
                      hackId={post.id}
                      pinned={pinned}
                    />
                  </div>
                ) : null}
                <PostCard
                  post={post}
                  summary={summary}
                  saved={saved}
                  reactions={reactions}
                />
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
