"use client"

import Link from "next/link"

import { IconAward } from "@/components/icons/post-card/icon-award"
import { IconComment } from "@/components/icons/post-card/icon-comment"
import { PostLikeButton } from "@/components/post/post-like-button"
import type { Post } from "@/lib/dummy/posts"
import type { PostCardReactions } from "@/lib/posts/feed-items"

export function PostCardDock({
  post,
  hackId,
  initialReactions,
}: {
  post: Post
  hackId: string
  initialReactions: PostCardReactions
}) {
  return (
    <div className="flex items-center justify-between rounded-full bg-white px-2 py-2 text-zinc-900 shadow-sm">
      <div className="flex items-center gap-2">
        <PostLikeButton
          hackId={hackId}
          liked={initialReactions.liked}
          likeCount={post.metrics.likes}
        />

        <Link
          href={`/hacks/${hackId}#comments`}
          className="relative flex size-12 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 transition-colors hover:bg-zinc-100"
          aria-label={`${post.metrics.comments} comments`}
          onClick={(e) => e.stopPropagation()}
        >
          <IconComment className="size-5" />
          {post.metrics.comments > 0 ? (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-medium text-white">
              {post.metrics.comments}
            </span>
          ) : null}
        </Link>
      </div>

      <div
        className="flex h-12 items-center gap-2 rounded-full border border-zinc-200 bg-white px-2"
        aria-label={`${post.metrics.points} rewards`}
      >
        <span
          className="flex size-[1.75rem] shrink-0 items-center justify-center rounded-full bg-[#FFB833]"
          aria-hidden
        >
          <IconAward className="size-[1.375rem] text-zinc-900" />
        </span>
        <span className="text-sm font-semibold tabular-nums text-zinc-900">
          {post.metrics.points}
        </span>
      </div>
    </div>
  )
}
