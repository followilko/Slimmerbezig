"use client"

import { useMemo } from "react"

import { PostCard } from "@/components/post/post-card"
import type { FeedPostItem } from "@/lib/posts/feed-items"

import { InfiniteGrid, type InfiniteGridItem } from "./infinite-grid"

export function ExploreInfiniteGrid({ items }: { items: FeedPostItem[] }) {
  const gridItems = useMemo<InfiniteGridItem[]>(
    () =>
      items.map(({ post, summary, saved, reactions }) => ({
        key: post.id,
        href: `/hacks/${post.id}`,
        node: (
          <PostCard
            post={post}
            summary={summary}
            saved={saved}
            reactions={reactions}
            peerStripMode="static"
          />
        ),
      })),
    [items]
  )

  return <InfiniteGrid items={gridItems} className="relative z-10" />
}
