import { HackViewTracker } from "@/components/feed/hack-view-tracker"
import { brandCardStyle, getBrand } from "@/lib/brands/get-brand"
import type { Post } from "@/lib/dummy/posts"
import type { PostCardReactions } from "@/lib/posts/feed-items"
import { cn } from "@/lib/utils"

import { PostCardDock } from "./post-card/post-card-dock"
import { PostCardMiddle } from "./post-card/post-card-middle"
import { PostCardTop } from "./post-card/post-card-top"
import { PostPeerStrip } from "./post-card/post-peer-strip"

export function PostCard({
  post,
  summary,
  saved,
  reactions,
  className,
  enableViewTracking = false,
  alreadyViewed = false,
}: {
  post: Post
  summary?: string | null
  saved: boolean
  reactions?: PostCardReactions
  className?: string
  enableViewTracking?: boolean
  alreadyViewed?: boolean
}) {
  const brand = getBrand(post.title.tool.slug)
  const reactionState = reactions ?? { helpful: false, notHelpful: false }
  const href = `/hacks/${post.id}`

  return (
    <div className={cn("relative h-full pb-8", className)}>
      {enableViewTracking ? (
        <HackViewTracker hackId={post.id} alreadyViewed={alreadyViewed} />
      ) : null}

      <article
        data-brand={brand.slug}
        className="relative flex h-full flex-col gap-4 overflow-hidden rounded-[2rem] p-4 shadow-sm transition-shadow hover:shadow-md"
        style={brandCardStyle(brand)}
      >
        <PostCardTop post={post} saved={saved} />
        <PostCardMiddle post={post} summary={summary ?? null} href={href} />
        <PostCardDock
          post={post}
          hackId={post.id}
          initialReactions={reactionState}
        />
      </article>

      <PostPeerStrip post={post} />
    </div>
  )
}
