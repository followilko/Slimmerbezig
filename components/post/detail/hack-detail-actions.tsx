"use client"

import { useOptimistic, useTransition } from "react"

import { toggleHackLike, toggleHackSave } from "@/app/(app)/hacks/[id]/actions"
import { IconBookmark } from "@/components/icons/post-card/icon-bookmark"
import { IconBookmarkFilled } from "@/components/icons/post-card/icon-bookmark-filled"
import { IconHeart } from "@/components/icons/post-card/icon-heart"
import { IconHeartFilled } from "@/components/icons/post-card/icon-heart-filled"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function HackDetailActions({
  hackId,
  initialLiked,
  initialSaved,
  likeCount,
  saveCount,
  className,
}: {
  hackId: string
  initialLiked: boolean
  initialSaved: boolean
  likeCount: number
  saveCount: number
  className?: string
}) {
  const [pending, startTransition] = useTransition()
  const [state, applyOptimistic] = useOptimistic(
    { liked: initialLiked, saved: initialSaved, likes: likeCount, saves: saveCount },
    (
      current,
      patch: Partial<{
        liked: boolean
        saved: boolean
        likes: number
        saves: number
      }>
    ) => ({ ...current, ...patch })
  )

  function handleLike() {
    startTransition(async () => {
      const next = !state.liked
      applyOptimistic({
        liked: next,
        likes: state.likes + (next ? 1 : -1),
      })
      const result = await toggleHackLike(hackId)
      if (!result.ok) {
        applyOptimistic({
          liked: !next,
          likes: state.likes,
        })
      }
    })
  }

  function handleSave() {
    startTransition(async () => {
      const next = !state.saved
      applyOptimistic({
        saved: next,
        saves: state.saves + (next ? 1 : -1),
      })
      const result = await toggleHackSave(hackId)
      if (!result.ok) {
        applyOptimistic({
          saved: !next,
          saves: state.saves,
        })
      }
    })
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3",
        className
      )}
    >
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        aria-pressed={state.liked}
        onClick={handleLike}
        className={cn(
          "h-11 gap-2 rounded-full border-zinc-200 bg-white px-5",
          state.liked && "border-favorite text-favorite"
        )}
      >
        {state.liked ? (
          <IconHeartFilled className="size-5" />
        ) : (
          <IconHeart className="size-5" />
        )}
        <span className="tabular-nums">{Math.max(0, state.likes)}</span>
        <span className="sr-only">Like</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        disabled={pending}
        aria-pressed={state.saved}
        onClick={handleSave}
        className={cn(
          "h-11 gap-2 rounded-full border-zinc-200 bg-white px-5",
          state.saved && "border-zinc-900 text-zinc-900"
        )}
      >
        {state.saved ? (
          <IconBookmarkFilled className="size-5" />
        ) : (
          <IconBookmark className="size-5" />
        )}
        <span className="tabular-nums">{Math.max(0, state.saves)}</span>
        <span className="sr-only">Opslaan</span>
      </Button>
    </div>
  )
}
