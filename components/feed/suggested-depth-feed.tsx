"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"

import gsap from "gsap"

import { PostCard } from "@/components/post/post-card"
import { getBrand } from "@/lib/brands/get-brand"
import type { FeedPostItem } from "@/lib/posts/feed-items"

import { DepthTiles } from "./depth-tiles"

/** Number of recommended posts in the Suggested depth carousel. */
export const SUGGESTED_TILE_COUNT = 6

/** Crossfade duration (s) when the active card's background light swaps in. */
const BACKGROUND_TRANSITION_DURATION = 0.7

/** Id of the app-shell root (app/(app)/layout.tsx) we tint behind everything. */
const APP_SHELL_ID = "app-shell"

export function SuggestedDepthFeed({ items }: { items: FeedPostItem[] }) {
  // Background-light color per tile, in the same order as the rendered tiles.
  const backgrounds = useMemo(
    () => items.map(({ post }) => getBrand(post.title.tool.slug).background),
    [items]
  )

  const originalShellBg = useRef<string | null>(null)

  // Tint the whole app shell (behind the transparent header) for this page,
  // and restore the original background when leaving.
  useEffect(() => {
    const shell = document.getElementById(APP_SHELL_ID)
    if (!shell) return
    originalShellBg.current = getComputedStyle(shell).backgroundColor
    gsap.set(shell, { backgroundColor: backgrounds[0] })

    return () => {
      if (originalShellBg.current) {
        gsap.set(shell, { backgroundColor: originalShellBg.current })
      }
    }
  }, [backgrounds])

  const handleActiveIndexChange = useCallback(
    (index: number) => {
      const shell = document.getElementById(APP_SHELL_ID)
      const color = backgrounds[index] ?? backgrounds[0]
      if (!shell || !color) return

      gsap.to(shell, {
        backgroundColor: color,
        duration: BACKGROUND_TRANSITION_DURATION,
        ease: "power2.out",
        overwrite: "auto",
      })
    },
    [backgrounds]
  )

  return (
    <DepthTiles
      className="relative z-10 w-full"
      onActiveIndexChange={handleActiveIndexChange}
    >
      {items.map(({ post, summary, saved, reactions }) => (
        <PostCard
          key={post.id}
          post={post}
          summary={summary}
          saved={saved}
          reactions={reactions}
          peerStripMode="carousel"
        />
      ))}
    </DepthTiles>
  )
}
