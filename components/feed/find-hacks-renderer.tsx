"use client"

import Link from "next/link"

type FindHacksHack = {
  id: string
  title: string
  summary: string | null
  source: string
}

type FindHacksOutput = {
  ok?: boolean
  query?: string
  count?: number
  hacks?: FindHacksHack[]
  reason?: string
}

/**
 * Custom renderer for the `find_hacks` AI tool output. Used by the Ask
 * overlay via `<CoachChat toolRenderers={{ find_hacks: ... }} />`.
 */
export function renderFindHacksOutput(output: unknown) {
  const data = output as FindHacksOutput | null
  if (!data) return null
  if (data.ok === false) {
    return (
      <div className="mt-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
        Search failed: {data.reason ?? "unknown"}
      </div>
    )
  }
  const hacks = data.hacks ?? []
  if (hacks.length === 0) {
    return (
      <div className="mt-2 rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
        Geen hacks gevonden voor &quot;{data.query ?? ""}&quot;.
      </div>
    )
  }
  return (
    <div className="mt-2 grid gap-2">
      {hacks.map((h) => (
        <Link
          key={h.id}
          href={`/hacks/${h.id}`}
          className="block rounded-lg border bg-card p-2.5 transition-shadow hover:shadow-sm"
        >
          <div className="mb-0.5 flex items-center justify-between gap-2">
            <div className="text-sm font-medium leading-snug">{h.title}</div>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {h.source}
            </span>
          </div>
          {h.summary ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {h.summary}
            </p>
          ) : null}
        </Link>
      ))}
    </div>
  )
}
