"use client"

import gsap from "gsap"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef } from "react"

import { CoachChat } from "@/components/ai/coach-chat"
import { Button } from "@/components/ui/button"

import { renderFindHacksOutput } from "./find-hacks-renderer"
import {
  AskNavigateProvider,
  renderSuggestChallengeOutput,
} from "./suggest-challenge-renderer"

const ASK_RENDERERS = {
  find_hacks: renderFindHacksOutput,
  suggest_challenge: renderSuggestChallengeOutput,
}

export function AskOverlay({
  initialQuestion,
  onClose,
}: {
  initialQuestion: string
  onClose: () => void
}) {
  const router = useRouter()
  const backdropRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const exitingRef = useRef(false)

  const onNavigate = useCallback(
    (href: string) => {
      if (exitingRef.current) return
      exitingRef.current = true

      const backdrop = backdropRef.current
      const panel = panelRef.current

      if (!backdrop || !panel) {
        onClose()
        router.push(href)
        return
      }

      gsap
        .timeline({
          onComplete: () => {
            onClose()
            router.push(href)
          },
        })
        .to(panel, { y: 28, opacity: 0, duration: 0.28, ease: "power2.in" }, 0)
        .to(backdrop, { opacity: 0, duration: 0.28, ease: "power2.in" }, 0)
    },
    [onClose, router]
  )

  // Escape closes; lock body scroll while open so the chat owns the viewport.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !exitingRef.current) onClose()
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
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/60 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !exitingRef.current) onClose()
      }}
    >
      <div
        ref={panelRef}
        className="relative flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border bg-background shadow-2xl"
      >
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
          <AskNavigateProvider onNavigate={onNavigate}>
            <CoachChat
              apiPath="/api/ask/chat"
              title="Ask"
              autoSendUserText={initialQuestion}
              toolRenderers={ASK_RENDERERS}
              hideSidebar
              compact
            />
          </AskNavigateProvider>
        </div>
      </div>
    </div>
  )
}
