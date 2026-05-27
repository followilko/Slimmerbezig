"use client"

import { useEffect, useRef, useState } from "react"

import { recordView } from "@/app/for-you/actions"

const DWELL_MS = 2000
const THRESHOLD = 0.5

/**
 * Drops a one-shot IntersectionObserver alongside a hack card. After the user
 * keeps the card ≥50% in view for 2s we POST `viewed` once, then unmount the
 * observer. Per-page-load idempotent on the client; server side dedupes via
 * the (user_id, hack_id, kind) primary key.
 */
export function HackViewTracker({
  hackId,
  alreadyViewed,
}: {
  hackId: string
  alreadyViewed?: boolean
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [fired, setFired] = useState<boolean>(Boolean(alreadyViewed))

  useEffect(() => {
    if (fired) return
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") return

    let timer: number | undefined

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= THRESHOLD) {
            if (timer == null) {
              timer = window.setTimeout(() => {
                setFired(true)
                void recordView(hackId)
              }, DWELL_MS)
            }
          } else if (timer != null) {
            window.clearTimeout(timer)
            timer = undefined
          }
        }
      },
      { threshold: [THRESHOLD] }
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      if (timer != null) window.clearTimeout(timer)
    }
  }, [hackId, fired])

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0"
    />
  )
}
