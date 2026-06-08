"use client"

import { Search as SearchIcon, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { AskSearchResults } from "./ask-search-results"

export function SearchOverlay({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.body.dataset.searchOverlayOpen = "true"
    requestAnimationFrame(() => inputRef.current?.focus())
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
      delete document.body.dataset.searchOverlayOpen
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/60 p-4 pt-20 backdrop-blur-sm sm:p-6 sm:pt-24"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-2xl">
        <div className="mb-2 flex items-center justify-end">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onClose}
            aria-label="Sluit zoeken"
            className="rounded-full"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="glass-bg flex items-center gap-2 rounded-full p-1.5">
          <SearchIcon className="ml-2 size-4 shrink-0 text-white/70" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hacks or share a work experience"
            aria-label="Search hacks"
            className={cn(
              "h-10 flex-1 border-0 bg-transparent px-1 text-sm text-white outline-none",
              "placeholder:text-white/60 focus:ring-0"
            )}
          />
        </div>

        <AskSearchResults query={query} showSeeAll={false} />
      </div>
    </div>
  )
}
