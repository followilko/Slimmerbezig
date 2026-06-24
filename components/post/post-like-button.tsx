"use client"

import { useOptimistic, useTransition } from "react"

import { toggleHackLike } from "@/app/(app)/hacks/[id]/actions"
import { IconHeart } from "@/components/icons/post-card/icon-heart"
import { IconHeartFilled } from "@/components/icons/post-card/icon-heart-filled"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function PostLikeButton({
  hackId,
  liked: initialLiked,
  likeCount,
  className,
}: {
  hackId: string
  liked: boolean
  likeCount: number
  className?: string
}) {
  const [pending, startTransition] = useTransition()
  const [state, applyOptimistic] = useOptimistic(
    { liked: initialLiked, count: likeCount },
    (current, patch: Partial<{ liked: boolean; count: number }>) => ({
      ...current,
      ...patch,
    })
  )

  function handleClick(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()

    startTransition(async () => {
      const next = !state.liked
      applyOptimistic({
        liked: next,
        count: state.count + (next ? 1 : -1),
      })
      const result = await toggleHackLike(hackId)
      if (!result.ok) {
        applyOptimistic({ liked: !next, count: state.count })
      }
    })
  }

  return (
    <div
      className={cn(
        "flex h-12 items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-1",
        className
      )}
    >
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        disabled={pending}
        aria-pressed={state.liked}
        aria-label={state.liked ? "Unlike" : "Like"}
        onClick={handleClick}
        className={cn(
          "size-12 rounded-full",
          state.liked && "text-favorite"
        )}
      >
        {state.liked ? (
          <IconHeartFilled className="size-5" />
        ) : (
          <IconHeart className="size-5" />
        )}
      </Button>
      <span className="min-w-[1.5rem] pr-2 text-center text-sm font-medium tabular-nums">
        {Math.max(0, state.count)}
      </span>
    </div>
  )
}
