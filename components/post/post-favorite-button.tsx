"use client"

import { Heart } from "lucide-react"
import { useOptimistic, useTransition } from "react"

import { togglePostFavorite } from "@/app/(app)/posts/actions"
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
        "relative z-10 size-8 rounded-full border transition-colors",
        optimisticSaved
          ? "border-favorite bg-favorite text-favorite-foreground hover:bg-favorite/90 hover:text-favorite-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
    >
      <Heart className={cn("size-4", optimisticSaved && "fill-current")} />
    </Button>
  )
}
