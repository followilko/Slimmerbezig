"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

type HackHit = {
  id: string
  title: string
  summary: string | null
  source: string
}

const DEBOUNCE_MS = 200

export function AskSearchResults({
  query,
  showSeeAll = true,
}: {
  query: string
  showSeeAll?: boolean
}) {
  const [hits, setHits] = useState<HackHit[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const trimmed = query.trim()
    // Empty query: the component renders null below, so stale hits never
    // surface — no need to reset state here (avoids the React 19
    // "setState in effect body" lint).
    if (!trimmed) return

    const handle = window.setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed, limit: 5 }),
        })
        if (!res.ok) {
          if (!cancelled) setHits([])
          return
        }
        const json = (await res.json()) as { hacks: HackHit[] }
        if (!cancelled) setHits(json.hacks ?? [])
      } catch {
        if (!cancelled) setHits([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [query])

  if (!query.trim()) return null
  if (!hits.length && !loading) return null

  return (
    <div className="mb-2 overflow-hidden rounded-xl border bg-background/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {loading && hits.length === 0 ? (
        <div className="p-3 text-xs text-muted-foreground">Zoeken…</div>
      ) : null}
      {hits.length > 0 ? (
        <ul className="max-h-80 overflow-y-auto p-1">
          {hits.map((h) => (
            <li key={h.id}>
              <Link
                href={`/hacks/${h.id}`}
                className="block rounded-md px-2.5 py-2 hover:bg-muted"
              >
                <div className="text-sm font-medium leading-snug">{h.title}</div>
                {h.summary ? (
                  <div className="line-clamp-2 text-xs text-muted-foreground">
                    {h.summary}
                  </div>
                ) : null}
              </Link>
            </li>
          ))}
          {showSeeAll ? (
            <li className="border-t pt-1">
              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                className="block rounded-md px-2.5 py-1.5 text-center text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Bekijk alle resultaten
              </Link>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  )
}
