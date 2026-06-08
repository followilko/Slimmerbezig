"use client"

import {
  Children,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react"

import gsap from "gsap"
import ScrollTrigger from "gsap/ScrollTrigger"

import { registerGsap } from "@/lib/anim/registerGsap"
import { cn } from "@/lib/utils"

import {
  DEPTH_TILES_EASE,
  DEPTH_TILES_MOVE_DURATION,
  DEPTH_TILES_PAUSE_DURATION,
  DEPTH_TILES_PEER_ENTER_AT,
  DEPTH_TILES_PEER_EXIT_LEAD_TIME,
  DEPTH_TILES_START_DELAY,
  ensureDepthTilesEase,
} from "./depth-tiles-motion"
import styles from "./depth-tiles.module.css"

type DepthTilesProps = {
  children: ReactNode
  className?: string
  /** Fires with the front/active tile index whenever it changes (and on init). */
  onActiveIndexChange?: (index: number) => void
}

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

function initDepthTilesContainer(
  container: HTMLElement,
  onActiveIndexChange?: (index: number) => void
) {
  const list = container.querySelector<HTMLElement>("[data-depth-tiles-list]")
  if (!list) return () => {}

  const tiles = container.querySelectorAll<HTMLElement>("[data-depth-tiles-item]")
  const tileCount = tiles.length
  if (tileCount < 2) return () => {}

  const xMultiplier = 0.65
  const backScale = 0.5
  const backOpacity = 1
  const backDarkness = 1
  const sideRotateY = 5
  const perspective = 75

  const moveDuration = DEPTH_TILES_MOVE_DURATION
  const startDelay = DEPTH_TILES_START_DELAY
  const pauseDuration = DEPTH_TILES_PAUSE_DURATION
  const peerExitLeadTime = DEPTH_TILES_PEER_EXIT_LEAD_TIME
  const peerEnterAt = DEPTH_TILES_PEER_ENTER_AT

  const state = { progress: 0 }

  let isActive = false
  let isHovering = false
  let hasStarted = false
  let stepTimeline: gsap.core.Timeline | undefined
  let delayedCall: gsap.core.Tween | undefined
  let exitDelayedCall: gsap.core.Tween | undefined
  let startDelayedCall: gsap.core.Tween | undefined
  let activeTileIndex = -1

  function setPeerPhase(index: number, phase: "shown" | "hiding" | "hidden") {
    tiles[index]?.setAttribute("data-depth-tiles-item-peer-phase", phase)
  }

  function syncPeerPhasesForFront(frontIndex: number) {
    tiles.forEach((_, index) => {
      setPeerPhase(index, index === frontIndex ? "shown" : "hidden")
    })
  }

  function scheduleNextStep() {
    exitDelayedCall?.kill()
    delayedCall?.kill()

    const frontIndex = getActiveIndex()

    exitDelayedCall = gsap.delayedCall(
      Math.max(0, pauseDuration - peerExitLeadTime),
      () => {
        setPeerPhase(frontIndex, "hiding")
      }
    )

    delayedCall = gsap.delayedCall(pauseDuration, beginMove)
  }

  function beginMove() {
    if (!isActive || isHovering) return

    const targetProgress = state.progress + 1
    const incomingFront =
      ((Math.round(targetProgress) % tileCount) + tileCount) % tileCount

    stepTimeline?.kill()
    stepTimeline = gsap.timeline({
      paused: true,
      onComplete: () => {
        syncPeerPhasesForFront(getActiveIndex())
        if (isActive && !isHovering) {
          scheduleNextStep()
        }
      },
    })

    stepTimeline.to(state, {
      progress: targetProgress,
      duration: moveDuration,
      ease: DEPTH_TILES_EASE,
      onUpdate: renderDepth,
    })

    stepTimeline.call(
      () => syncPeerPhasesForFront(incomingFront),
      undefined,
      peerEnterAt
    )

    stepTimeline.play()
  }

  gsap.set(list, { perspective: `${perspective}em` })
  gsap.set(tiles, {
    transformStyle: "preserve-3d",
    transformPerspective: perspective * 16,
  })

  function getRelativeIndex(index: number) {
    let relative = index - state.progress
    relative =
      ((((relative + tileCount / 2) % tileCount) + tileCount) % tileCount) -
      tileCount / 2
    return gsap.utils.clamp(-2, 2, relative)
  }

  function getActiveIndex() {
    return ((Math.round(state.progress) % tileCount) + tileCount) % tileCount
  }

  function updateTileStatus() {
    const currentActiveIndex = getActiveIndex()
    if (currentActiveIndex === activeTileIndex) return

    activeTileIndex = currentActiveIndex

    tiles.forEach((tile, index) => {
      tile.setAttribute(
        "data-depth-tiles-item-status",
        index === activeTileIndex ? "active" : "not-active"
      )
    })

    onActiveIndexChange?.(currentActiveIndex)
  }

  function renderDepth() {
    const tileWidth = tiles[0].offsetWidth
    const radiusX = tileWidth * xMultiplier

    updateTileStatus()

    tiles.forEach((tile, index) => {
      const relative = getRelativeIndex(index)
      const angle = (relative / 2) * Math.PI

      const orbitX = Math.sin(angle) * radiusX
      const orbitDepth = (Math.cos(angle) + 1) / 2

      const x = relative <= -2 || relative >= 2 ? 0 : orbitX
      const scale = gsap.utils.interpolate(backScale, 1, orbitDepth)
      const opacity = gsap.utils.interpolate(backOpacity, 1, orbitDepth)
      const brightness = gsap.utils.interpolate(backDarkness, 1, orbitDepth)
      const rotateY = Math.sin(angle) * -sideRotateY
      const zIndex = Math.round(gsap.utils.interpolate(1, 1000, orbitDepth))

      gsap.set(tile, {
        x,
        scale,
        opacity,
        rotateY,
        filter: `brightness(${brightness})`,
        zIndex,
      })
    })
  }

  function goToNextTile() {
    scheduleNextStep()
  }

  function pauseDepth() {
    isActive = false
    stepTimeline?.pause()
    delayedCall?.pause()
    exitDelayedCall?.pause()
    startDelayedCall?.pause()
  }

  function playDepth() {
    isActive = true
    if (isHovering) return

    if (!hasStarted) {
      hasStarted = true
      startDelayedCall = gsap.delayedCall(startDelay, goToNextTile)
      return
    }

    if (stepTimeline && stepTimeline.progress() < 1) {
      stepTimeline.play()
    } else {
      exitDelayedCall?.play()
      delayedCall?.play()
    }
  }

  function handleHoverStart() {
    isHovering = true
    delayedCall?.pause()
    exitDelayedCall?.pause()
    startDelayedCall?.pause()
  }

  function handleHoverEnd() {
    isHovering = false
    if (!isActive) return

    if (!hasStarted) {
      playDepth()
      return
    }

    if (stepTimeline && stepTimeline.progress() < 1) {
      stepTimeline.play()
    } else {
      exitDelayedCall?.play()
      delayedCall?.play()
    }
  }

  const onPointerOver = (event: PointerEvent) => {
    if (!(event.target as Element).closest("[data-depth-tiles-item]")) return
    handleHoverStart()
  }

  const onPointerLeave = () => {
    handleHoverEnd()
  }

  list.addEventListener("pointerover", onPointerOver)
  list.addEventListener("pointerleave", onPointerLeave)

  let layoutRaf = 0
  let resizeRaf = 0

  const syncLayout = () => {
    if (tiles[0].offsetWidth <= 0) return
    renderDepth()
    syncPeerPhasesForFront(getActiveIndex())
    ScrollTrigger.refresh()
  }

  const onResize = () => {
    cancelAnimationFrame(resizeRaf)
    resizeRaf = requestAnimationFrame(syncLayout)
  }

  window.addEventListener("resize", onResize)

  layoutRaf = requestAnimationFrame(() => {
    layoutRaf = requestAnimationFrame(syncLayout)
  })

  const scrollTrigger = ScrollTrigger.create({
    trigger: container,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => (self.isActive ? playDepth() : pauseDepth()),
  })

  return () => {
    pauseDepth()
    cancelAnimationFrame(layoutRaf)
    cancelAnimationFrame(resizeRaf)
    window.removeEventListener("resize", onResize)
    stepTimeline?.kill()
    delayedCall?.kill()
    exitDelayedCall?.kill()
    startDelayedCall?.kill()
    scrollTrigger.kill()
    list.removeEventListener("pointerover", onPointerOver)
    list.removeEventListener("pointerleave", onPointerLeave)
    gsap.set(tiles, { clearProps: "all" })
  }
}

export function DepthTiles({
  children,
  className,
  onActiveIndexChange,
}: DepthTilesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  )
  const tiles = Children.toArray(children)

  useEffect(() => {
    if (reducedMotion) return
    const container = containerRef.current
    if (!container || tiles.length < 2) return

    registerGsap()
    ensureDepthTilesEase()

    return initDepthTilesContainer(container, onActiveIndexChange)
  }, [reducedMotion, tiles.length, onActiveIndexChange])

  if (tiles.length < 2) {
    return null
  }

  if (reducedMotion) {
    return (
      <div className={cn(styles.reducedMotionStack, className)}>
        <div className={styles.reducedMotionCard}>{tiles[0]}</div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      data-depth-tiles-init
      className={cn(styles.depthTiles, className)}
    >
      <div data-depth-tiles-collection className={styles.depthTilesCollection}>
        <div data-depth-tiles-list className={styles.depthTilesList}>
          {Children.map(tiles, (tile, index) => (
            <div
              key={
                typeof tile === "object" &&
                tile !== null &&
                "key" in tile &&
                tile.key != null
                  ? String(tile.key)
                  : index
              }
              data-depth-tiles-item
              data-depth-tiles-item-status={
                index === 0 ? "active" : "not-active"
              }
              data-depth-tiles-item-peer-phase={
                index === 0 ? "shown" : "hidden"
              }
              className={styles.depthTilesItem}
            >
              <div className={styles.tileCard}>{tile}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
