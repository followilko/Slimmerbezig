"use client"

import { PostCard } from "@/components/post/post-card"
import type { FeedPostItem } from "@/lib/posts/feed-items"

import { DepthTiles } from "./depth-tiles"

/** Number of recommended posts in the Suggested depth carousel. */
export const SUGGESTED_TILE_COUNT = 6

export function SuggestedDepthFeed({ items }: { items: FeedPostItem[] }) {
  return (
    <DepthTiles className="w-full">
      {items.map(({ post, summary, saved, reactions }) => (
        <PostCard
          key={post.id}
          post={post}
          summary={summary}
          saved={saved}
          reactions={reactions}
        />
      ))}
    </DepthTiles>
  )
}
