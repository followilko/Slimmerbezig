"use client"

import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function SidebarChannelSearch() {
  const router = useRouter()
  const [value, setValue] = useState("")

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const q = value.trim()
        router.push(q ? `/channels?q=${encodeURIComponent(q)}` : "/channels")
      }}
      className="relative"
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Zoek kanaal..."
        aria-label="Zoek kanaal"
        className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-foreground/15"
      />
    </form>
  )
}
