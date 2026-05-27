"use client"

import { Bookmark, ThumbsDown, ThumbsUp } from "lucide-react"
import { useOptimistic, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import {
  setReaction,
  toggleSave,
  type ReactionKind,
} from "@/app/for-you/actions"

export type HackReactions = {
  helpful: boolean
  notHelpful: boolean
  saved: boolean
}

const EMPTY_REACTIONS: HackReactions = {
  helpful: false,
  notHelpful: false,
  saved: false,
}

export function HackCardActions({
  hackId,
  initial = EMPTY_REACTIONS,
}: {
  hackId: string
  initial?: HackReactions
}) {
  const [optimistic, applyOptimistic] = useOptimistic<
    HackReactions,
    Partial<HackReactions>
  >(initial, (state, patch) => ({ ...state, ...patch }))

  const [pending, startTransition] = useTransition()

  function handleReaction(target: ReactionKind) {
    startTransition(async () => {
      const isOn = target === "helpful" ? optimistic.helpful : optimistic.notHelpful
      const next: ReactionKind | null = isOn ? null : target
      applyOptimistic({
        helpful: next === "helpful",
        notHelpful: next === "not_helpful",
      })
      await setReaction(hackId, next)
    })
  }

  function handleSave() {
    startTransition(async () => {
      applyOptimistic({ saved: !optimistic.saved })
      await toggleSave(hackId)
    })
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-pressed={optimistic.helpful}
        aria-label="Mark as helpful"
        disabled={pending}
        onClick={() => handleReaction("helpful")}
      >
        <ThumbsUp
          className={cn(
            "size-3.5 transition-colors",
            optimistic.helpful && "fill-current text-emerald-600"
          )}
        />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-pressed={optimistic.notHelpful}
        aria-label="Mark as not helpful"
        disabled={pending}
        onClick={() => handleReaction("not_helpful")}
      >
        <ThumbsDown
          className={cn(
            "size-3.5 transition-colors",
            optimistic.notHelpful && "fill-current text-destructive"
          )}
        />
      </Button>
      <span aria-hidden className="ml-auto" />
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-pressed={optimistic.saved}
        aria-label={optimistic.saved ? "Unsave" : "Save"}
        disabled={pending}
        onClick={handleSave}
      >
        <Bookmark
          className={cn(
            "size-3.5 transition-colors",
            optimistic.saved && "fill-current text-amber-500"
          )}
        />
      </Button>
    </div>
  )
}
