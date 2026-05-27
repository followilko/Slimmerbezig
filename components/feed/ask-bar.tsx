"use client"

import gsap from "gsap"
import {
  ArrowRight,
  MessageCircle,
  Search as SearchIcon,
} from "lucide-react"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

import { AskOverlay } from "./ask-overlay"
import { AskSearchResults } from "./ask-search-results"

const HIDDEN_PATHS = ["/login", "/onboarding", "/checkin"]
const HIDDEN_PREFIXES = ["/auth/"]

type Tab = "search" | "ask"

export function AskBar() {
  const pathname = usePathname() ?? ""
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [tab, setTab] = useState<Tab>("search")
  const [query, setQuery] = useState("")
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [overlayQuestion, setOverlayQuestion] = useState("")

  const hidden =
    HIDDEN_PATHS.includes(pathname) ||
    HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))

  // GSAP-driven minimize on scroll-down, restore on scroll-up.
  // Uses native scroll events — Lenis bridges to window.scrollY via gsap.ticker
  // (see SmoothScrollProvider).
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

  useEffect(() => {
    if (hidden) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [hidden])

  if (hidden) return null

  function openOverlay(seed: string) {
    setOverlayQuestion(seed)
    setOverlayOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = query.trim()
    if (!text) return
    if (tab === "ask") {
      openOverlay(text)
      setQuery("")
    }
    // Search tab submits implicitly via the dropdown — pressing Enter is a no-op.
  }

  const placeholder =
    tab === "search"
      ? "Search hacks or share a work experience"
      : "Stel een vraag aan de coach…"

  return (
    <>
      <div
        ref={wrapperRef}
        className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4"
      >
        <div className="pointer-events-auto w-full max-w-2xl">
          {tab === "search" ? <AskSearchResults query={query} /> : null}

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 rounded-full border border-border bg-white p-1.5 shadow-lg"
          >
            <div
              role="tablist"
              aria-label="Search or ask the coach"
              className="flex shrink-0 items-center gap-0.5 pl-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={tab === "search"}
                aria-label="Search hacks"
                title="Search hacks"
                onClick={() => setTab("search")}
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full transition-colors",
                  tab === "search"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <SearchIcon className="size-3.5" />
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "ask"}
                aria-label="Ask the coach"
                title="Ask the coach"
                onClick={() => setTab("ask")}
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full transition-colors",
                  tab === "ask"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <MessageCircle className="size-3.5" />
              </button>
            </div>

            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              aria-label={placeholder}
              className="h-9 flex-1 border-0 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-0"
            />

            <button
              type="submit"
              aria-label={tab === "ask" ? "Ask" : "Search"}
              disabled={tab === "ask" && !query.trim()}
              className={cn(
                "inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-90 disabled:opacity-40"
              )}
            >
              {tab === "ask" ? (
                <ArrowRight className="size-4" />
              ) : (
                <SearchIcon className="size-4" />
              )}
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
