"use client"

import { useOptimistic, useTransition } from "react"

import { toggleHackSave } from "@/app/(app)/hacks/[id]/actions"
import { IconBookmark } from "@/components/icons/post-card/icon-bookmark"
import { IconBookmarkFilled } from "@/components/icons/post-card/icon-bookmark-filled"
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

      const result = await toggleHackSave(postId)
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
      aria-label={optimisticSaved ? "Verwijder uit opgeslagen" : "Opslaan"}
      disabled={pending}
      onClick={handleClick}
      className={cn(
        "relative z-10 size-8 rounded-full border-0 bg-white transition-colors hover:bg-white",
        optimisticSaved ? "text-zinc-900" : "text-zinc-900",
        className
      )}
    >
      {optimisticSaved ? (
        <IconBookmarkFilled className="size-5" />
      ) : (
        <IconBookmark className="size-5" />
      )}
    </Button>
  )
}
