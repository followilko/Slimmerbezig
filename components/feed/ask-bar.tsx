"use client"

import gsap from "gsap"
import { Search as SearchIcon } from "lucide-react"
import { usePathname, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { COMPOSE_HACK, COMPOSE_PARAM } from "@/components/post/post-maker/compose-param"
import { cn } from "@/lib/utils"

import { AskOverlay } from "./ask-overlay"

const HIDDEN_PATHS = ["/login", "/onboarding", "/checkin"]
const HIDDEN_PREFIXES = ["/auth/"]
const COLLAPSED_WIDTH_PX = 200
const EXPANDED_MAX_WIDTH_PX = 672 // max-w-2xl (42rem)

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true
  return target.isContentEditable
}

export function AskBar() {
  const pathname = usePathname() ?? ""
  const searchParams = useSearchParams()
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const pillRef = useRef<HTMLFormElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState(false)
  const [focused, setFocused] = useState(false)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [overlayQuestion, setOverlayQuestion] = useState("")

  // Hide while the post-maker (or any compose modal) is open — keep the screen
  // to the forms only.
  const composing = searchParams.get(COMPOSE_PARAM) === COMPOSE_HACK
  const hidden =
    composing ||
    HIDDEN_PATHS.includes(pathname) ||
    HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))

  const showDecorativeCaret = !focused && query.length === 0

  const animateWidth = useCallback((toExpanded: boolean, instant = false) => {
    const pill = pillRef.current
    if (!pill) return

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    const targetWidth = toExpanded ? EXPANDED_MAX_WIDTH_PX : COLLAPSED_WIDTH_PX

    if (instant || prefersReduced) {
      gsap.set(pill, { width: targetWidth })
    } else {
      gsap.to(pill, {
        width: targetWidth,
        duration: 0.4,
        ease: "power3.out",
      })
    }
    setExpanded(toExpanded)
  }, [])

  const expand = useCallback(
    (instant = false) => {
      if (!expanded) animateWidth(true, instant)
    },
    [animateWidth, expanded]
  )

  const collapse = useCallback(
    (instant = false) => {
      if (expanded) animateWidth(false, instant)
    },
    [animateWidth, expanded]
  )

  const focusInput = useCallback(() => {
    expand()
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [expand])

  // Initial collapsed width.
  useEffect(() => {
    const pill = pillRef.current
    if (!pill) return
    gsap.set(pill, { width: COLLAPSED_WIDTH_PX })
  }, [])

  // GSAP-driven minimize on scroll-down, restore on scroll-up.
  useEffect(() => {
    if (hidden || overlayOpen) return
    const el = wrapperRef.current
    if (!el) return
    let lastY = window.scrollY
    let minimized = false
    const onScroll = () => {
      const y = window.scrollY
      const delta = y - lastY
      if (Math.abs(delta) < 6) return
      if (delta > 0 && !minimized && y > 80) {
        gsap.to(el, {
          yPercent: 80,
          opacity: 0.55,
          duration: 0.25,
          ease: "power2.out",
        })
        minimized = true
      } else if (delta < 0 && minimized) {
        gsap.to(el, {
          yPercent: 0,
          opacity: 1,
          duration: 0.25,
          ease: "power2.out",
        })
        minimized = false
      }
      lastY = y
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      gsap.to(el, { yPercent: 0, opacity: 1, duration: 0.2 })
    }
  }, [hidden, overlayOpen])

  // Cmd/Ctrl+K focuses the Ask bar.
  useEffect(() => {
    if (hidden) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        focusInput()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [hidden, focusInput])

  // Global type-to-enter: printable keys focus + expand + append when safe.
  useEffect(() => {
    if (hidden || overlayOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key.length !== 1) return
      if (isEditableTarget(e.target)) return
      if (document.body.dataset.searchOverlayOpen === "true") return

      e.preventDefault()
      expand()
      setQuery((prev) => prev + e.key)
      requestAnimationFrame(() => inputRef.current?.focus())
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [hidden, overlayOpen, expand])

  if (hidden) return null

  function openOverlay(seed: string) {
    setOverlayQuestion(seed)
    setOverlayOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = query.trim()
    if (!text) return
    openOverlay(text)
    setQuery("")
    setFocused(false)
    inputRef.current?.blur()
    collapse()
  }

  function handleBlur() {
    setFocused(false)
    if (!query.trim()) {
      collapse()
    }
  }

  return (
    <>
      <div
        ref={wrapperRef}
        className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4"
      >
        <div className="pointer-events-auto flex w-full max-w-2xl justify-center">
          <form
            ref={pillRef}
            onSubmit={handleSubmit}
            onClick={() => {
              if (!expanded) focusInput()
            }}
            className="glass-bg flex shrink-0 items-center gap-2 overflow-hidden rounded-full p-1.5"
            style={{ width: COLLAPSED_WIDTH_PX }}
          >
            <div className="relative min-w-0 flex-1">
              {showDecorativeCaret ? (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 flex items-center gap-0.5 px-2"
                >
                  <span className="animate-caret-blink h-4 w-px shrink-0 bg-white" />
                  <span className="truncate text-sm text-white/60">
                    Ask ai...
                  </span>
                </div>
              ) : null}

              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  setFocused(true)
                  expand()
                }}
                onBlur={handleBlur}
                placeholder=""
                aria-label="Ask ai"
                className={cn(
                  "h-9 w-full min-w-0 border-0 bg-transparent px-2 text-sm text-white outline-none focus:ring-0",
                  showDecorativeCaret ? "caret-transparent" : "caret-white"
                )}
              />
            </div>

            <button
              type="submit"
              aria-label="Ask"
              disabled={!query.trim()}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <SearchIcon className="size-4" />
            </button>
          </form>
        </div>
      </div>

      {overlayOpen ? (
        <AskOverlay
          initialQuestion={overlayQuestion}
          onClose={() => {
            setOverlayOpen(false)
            setOverlayQuestion("")
          }}
        />
      ) : null}
    </>
  )
}
