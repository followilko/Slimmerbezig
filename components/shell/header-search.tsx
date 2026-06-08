"use client"

import { Search as SearchIcon } from "lucide-react"
import { useState } from "react"

import { SearchOverlay } from "@/components/feed/search-overlay"
import { cn } from "@/lib/utils"

export function HeaderSearch() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-label="Search hacks"
        title="Search hacks"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-full text-white transition-colors",
          "hover:bg-white/15"
        )}
      >
        <SearchIcon className="size-4" />
      </button>

      {open ? <SearchOverlay onClose={() => setOpen(false)} /> : null}
    </>
  )
}
