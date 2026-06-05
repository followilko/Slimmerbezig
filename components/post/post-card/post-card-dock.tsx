"use client"

import Link from "next/link"
import { useOptimistic, useTransition } from "react"

import { IconArrowDown } from "@/components/icons/post-card/icon-arrow-down"
import { IconArrowUp } from "@/components/icons/post-card/icon-arrow-up"
import { IconAward } from "@/components/icons/post-card/icon-award"
import { IconComment } from "@/components/icons/post-card/icon-comment"
import {
  setReaction,
  type ReactionKind,
} from "@/app/for-you/actions"
import type { Post } from "@/lib/dummy/posts"
import type { PostCardReactions } from "@/lib/posts/feed-items"
import { cn } from "@/lib/utils"

export function PostCardDock({
  post,
  hackId,
  initialReactions,
}: {
  post: Post
  hackId: string
  initialReactions: PostCardReactions
}) {
  const [optimistic, applyOptimistic] = useOptimistic(
    initialReactions,
    (state, patch: Partial<PostCardReactions>) => ({ ...state, ...patch })
  )
  const [pending, startTransition] = useTransition()

  const voteScore = post.metrics.likes

  function handleReaction(target: ReactionKind) {
    startTransition(async () => {
      const isOn =
        target === "helpful" ? optimistic.helpful : optimistic.notHelpful
      const next: ReactionKind | null = isOn ? null : target
      applyOptimistic({
        helpful: next === "helpful",
        notHelpful: next === "not_helpful",
      })
      await setReaction(hackId, next)
    })
  }

  return (
    <div className="flex items-center justify-between rounded-full bg-white px-2 py-2 text-zinc-900 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-12 items-center rounded-full border border-zinc-200 bg-zinc-50">
            <button
              type="button"
              disabled={pending}
              aria-pressed={optimistic.helpful}
              aria-label="Vote up"
              onClick={() => handleReaction("helpful")}
              className={cn(
                "flex size-12 items-center justify-center rounded-l-full transition-colors",
                optimistic.helpful && "text-emerald-600"
              )}
            >
              <IconArrowUp />
            </button>
            <span className="min-w-[1.5rem] px-1 text-center text-sm font-medium tabular-nums">
              {voteScore}
            </span>
            <span className="h-8 w-px bg-zinc-200" aria-hidden />
            <button
              type="button"
              disabled={pending}
              aria-pressed={optimistic.notHelpful}
              aria-label="Vote down"
              onClick={() => handleReaction("not_helpful")}
              className={cn(
                "flex size-12 items-center justify-center rounded-r-full transition-colors",
                optimistic.notHelpful && "text-red-600"
              )}
            >
              <IconArrowDown />
            </button>
          </div>

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
