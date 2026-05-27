"use client"

import { X } from "lucide-react"
import { useEffect } from "react"

import { CoachChat } from "@/components/ai/coach-chat"
import { Button } from "@/components/ui/button"

import { renderFindHacksOutput } from "./find-hacks-renderer"

const FIND_HACKS_RENDERERS = { find_hacks: renderFindHacksOutput }

export function AskOverlay({
  initialQuestion,
  onClose,
}: {
  initialQuestion: string
  onClose: () => void
}) {
  // Escape closes; lock body scroll while open so the chat owns the viewport.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/60 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <div>
            <h2 className="text-sm font-semibold leading-none">Ask Slimmerbezig</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Vraag, deel een frustratie of zoek een hack — de coach helpt.
            </p>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onClose}
            aria-label="Sluit overlay"
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <CoachChat
            apiPath="/api/ask/chat"
            title="Ask"
            autoSendUserText={initialQuestion}
            toolRenderers={FIND_HACKS_RENDERERS}
            hideSidebar
            compact
          />
        </div>
      </div>
    </div>
  )
}
