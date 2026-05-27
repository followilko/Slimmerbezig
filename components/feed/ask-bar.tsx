"use client"

import gsap from "gsap"
import { MessageCircle, Search as SearchIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
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
  // (see SmoothScrollProvider). Don't run while the overlay is open or the bar
  // is hidden — avoid stray transforms.
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

  // Cmd+K / Ctrl+K → focus the bar input.
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
    // Search tab submits implicitly via the dropdown — no nav on Enter for now.
  }

  return (
    <>
      <div
        ref={wrapperRef}
        className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4"
      >
        <div className="pointer-events-auto w-full max-w-2xl">
          {tab === "search" ? <AskSearchResults query={query} /> : null}

          <div className="rounded-full border bg-background/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-1.5 p-1.5"
            >
              <div className="flex shrink-0 gap-0.5 rounded-full bg-muted/60 p-0.5">
                <button
                  type="button"
                  aria-pressed={tab === "search"}
                  onClick={() => setTab("search")}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    tab === "search"
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <SearchIcon className="size-3" />
                  Search
                </button>
                <button
                  type="button"
                  aria-pressed={tab === "ask"}
                  onClick={() => setTab("ask")}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    tab === "ask"
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <MessageCircle className="size-3" />
                  Ask
                </button>
              </div>

              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  tab === "search"
                    ? "Zoek hacks…  (⌘K)"
                    : "Stel een vraag…  (⌘K)"
                }
                className="h-8 flex-1 border-0 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground focus:ring-0"
              />

              {tab === "ask" ? (
                <Button
                  type="submit"
                  size="sm"
                  disabled={!query.trim()}
                  className="shrink-0"
                >
                  Vraag
                </Button>
              ) : null}
            </form>
          </div>
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
