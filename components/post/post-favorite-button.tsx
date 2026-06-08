"use client"

import { useOptimistic, useTransition } from "react"

import { togglePostFavorite } from "@/app/(app)/posts/actions"
import { IconHeart } from "@/components/icons/post-card/icon-heart"
import { IconHeartFilled } from "@/components/icons/post-card/icon-heart-filled"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function PostFavoriteButton({
  postId,
  saved: initialSaved,
  onToggle,
  className,
}: {
  postId: string
  saved: boolean
  onToggle?: (next: boolean) => Promise<void> | void
  className?: string
}) {
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(
    initialSaved,
    (_current, next: boolean) => next
  )
  const [pending, startTransition] = useTransition()

  function handleClick(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()

    startTransition(async () => {
      const next = !optimisticSaved
      setOptimisticSaved(next)

      if (onToggle) {
        await onToggle(next)
        return
      }

      const result = await togglePostFavorite(postId)
      if (!result.ok) {
        setOptimisticSaved(!next)
      }
    })
  }

  return (
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      aria-pressed={optimisticSaved}
      aria-label={optimisticSaved ? "Remove from favorites" : "Add to favorites"}
      disabled={pending}
      onClick={handleClick}
      className={cn(
        // Plain white circle, no border; heart is black by default and turns
        // red + filled when active.
        "relative z-10 size-8 rounded-full border-0 bg-white transition-colors hover:bg-white",
        optimisticSaved ? "text-favorite" : "text-zinc-900",
        className
      )}
    >
      {optimisticSaved ? (
        <IconHeartFilled className="size-5" />
      ) : (
        <IconHeart className="size-5" />
      )}
    </Button>
  )
}
