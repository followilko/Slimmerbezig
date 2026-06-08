"use client"

import { useEffect, useRef, useSyncExternalStore } from "react"

import gsap from "gsap"

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DEPTH_TILES_BACK_SCALE,
  DEPTH_TILES_EASE,
  DEPTH_TILES_PEER_ENTER_DURATION,
  DEPTH_TILES_PEER_EXIT_LEAD_TIME,
  ensureDepthTilesEase,
} from "@/components/feed/depth-tiles-motion"
import type { Post } from "@/lib/dummy/posts"

import { formatPeerCompletionText } from "../post-peer-footer"

function initialsFor(name: string): string {
  return name.charAt(0)?.toUpperCase() ?? "?"
}

export type PostPeerStripMode = "static" | "carousel"

type PeerPhase = "shown" | "hiding" | "hidden"

/** Vertical offset — strip descends from above as the card comes forward. */
const PEER_STRIP_TRAVEL_Y = -18

function subscribeReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)")
  media.addEventListener("change", onStoreChange)
  return () => media.removeEventListener("change", onStoreChange)
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function getReducedMotionServerSnapshot() {
  return false
}

/** Social proof chip — floats below the card shell, outside brand background. */
export function PostPeerStrip({
  post,
  mode = "static",
}: {
  post: Post
  mode?: PostPeerStripMode
}) {
  const stripRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  )

  const text = formatPeerCompletionText(
    post.completedByPeers,
    post.totalPeerCompletions
  )

  useEffect(() => {
    if (mode !== "carousel" || !text || !stripRef.current) return

    const strip = stripRef.current
    const tile = strip.closest("[data-depth-tiles-item]")
    if (!tile) return

    ensureDepthTilesEase()

    let activeTimeline: gsap.core.Timeline | undefined
    let currentPhase: PeerPhase | null = null

    const setHidden = () => {
      gsap.set(strip, {
        opacity: 0,
        y: PEER_STRIP_TRAVEL_Y,
        scale: DEPTH_TILES_BACK_SCALE,
        visibility: "hidden",
      })
    }

    const setVisible = () => {
      gsap.set(strip, { opacity: 1, y: 0, scale: 1, visibility: "visible" })
    }

    const playEnter = () => {
      activeTimeline?.kill()

      if (reducedMotion) {
        setVisible()
        return
      }

      gsap.set(strip, { visibility: "visible" })
      activeTimeline = gsap
        .timeline()
        .fromTo(
          strip,
          {
            opacity: 0,
            y: PEER_STRIP_TRAVEL_Y,
            scale: DEPTH_TILES_BACK_SCALE,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: DEPTH_TILES_PEER_ENTER_DURATION,
            ease: DEPTH_TILES_EASE,
          }
        )
        .to(strip, { scale: 1.05, duration: 0.14, ease: "power2.out" })
        .to(strip, { scale: 1, duration: 0.22, ease: "power2.inOut" })
    }

    const playExit = () => {
      activeTimeline?.kill()

      if (reducedMotion) {
        setHidden()
        return
      }

      activeTimeline = gsap.timeline({ onComplete: setHidden }).to(strip, {
        opacity: 0,
        y: PEER_STRIP_TRAVEL_Y,
        scale: DEPTH_TILES_BACK_SCALE,
        duration: DEPTH_TILES_PEER_EXIT_LEAD_TIME,
        ease: DEPTH_TILES_EASE,
      })
    }

    const syncToPeerPhase = () => {
      const phase = tile.getAttribute(
        "data-depth-tiles-item-peer-phase"
      ) as PeerPhase | null

      if (phase === currentPhase) return
      currentPhase = phase

      if (phase === "shown") playEnter()
      else if (phase === "hiding") playExit()
      else setHidden()
    }

    setHidden()

    const observer = new MutationObserver(syncToPeerPhase)
    observer.observe(tile, {
      attributes: true,
      attributeFilter: ["data-depth-tiles-item-peer-phase"],
    })

    syncToPeerPhase()

    return () => {
      observer.disconnect()
      activeTimeline?.kill()
      gsap.set(strip, { clearProps: "opacity,transform,visibility" })
    }
  }, [mode, reducedMotion, text, post.id])

  if (!text) return null

  const avatars = post.completedByPeers.slice(0, 3)

  return (
    <div
      ref={stripRef}
      data-post-peer-strip
      data-post-peer-strip-mode={mode}
      className="pointer-events-none absolute top-full right-0 left-0 z-10 mt-2 flex justify-center"
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
        <AvatarGroup>
          {avatars.map((peer) => (
            <Avatar key={peer.name} size="sm" className="size-6">
              {peer.avatarUrl ? (
                <AvatarImage src={peer.avatarUrl} alt={peer.name} />
              ) : null}
              <AvatarFallback className="text-[10px]">
                {initialsFor(peer.name)}
              </AvatarFallback>
            </Avatar>
          ))}
        </AvatarGroup>
        <span>{text}</span>
      </div>
    </div>
  )
}
