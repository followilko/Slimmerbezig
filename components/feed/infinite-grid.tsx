"use client"

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react"

import gsap from "gsap"
import Observer from "gsap/Observer"
import { useRouter } from "next/navigation"

import { registerGsap } from "@/lib/anim/registerGsap"
import { cn } from "@/lib/utils"

import styles from "./infinite-grid.module.css"

export type InfiniteGridItem = {
  key: string
  href: string
  node: ReactNode
}

type InfiniteGridProps = {
  items: InfiniteGridItem[]
  className?: string
  /** Wheel / trackpad speed (OSMO default). */
  wheelSpeed?: number
  /** Drag speed (OSMO default). */
  dragSpeed?: number
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

/**
 * Faithful port of the Osmo "Infinite Draggable Grid (Basic)" script.
 *
 * React adaptation: the source `[data-infinite-grid-list]` is a hidden template
 * (sibling of the collection) so the script never destroys React-owned nodes —
 * it only ever mutates the separate `[data-infinite-grid-collection]`. All
 * `data-infinite-grid-*` attributes and the original animation math are kept.
 */
function initInfiniteGrid(
  wrapper: HTMLElement,
  options: {
    wheelSpeed: number
    dragSpeed: number
    navigate: (href: string) => void
  }
): () => void {
  const { wheelSpeed, dragSpeed, navigate } = options

  const collection = wrapper.querySelector<HTMLElement>(
    "[data-infinite-grid-collection]"
  )
  const sourceList = wrapper.querySelector<HTMLElement>(
    "[data-infinite-grid-list]"
  )
  if (!collection || !sourceList) return () => {}

  const originalItems = Array.from(
    sourceList.querySelectorAll<HTMLElement>("[data-infinite-grid-item]")
  )
  if (!originalItems.length) return () => {}

  let observer: Observer | undefined
  let resizeTimer: ReturnType<typeof setTimeout> | undefined
  let scrollTimeout: ReturnType<typeof setTimeout> | undefined
  let hasMouseLeaveListener = false
  let tileWidth = 0
  let tileHeight = 0
  let currentX = 0
  let currentY = 0
  let xTo: ((value: number) => void) | undefined
  let yTo: ((value: number) => void) | undefined
  // Distinguishes a drag-release from a genuine tap so links still navigate.
  let dragMoved = false
  // Href of the item under the pointer at press time (used for tap nav).
  let pressedHref: string | null = null

  function setStatus(status: string) {
    wrapper.setAttribute("data-infinite-grid-status", status)
  }

  function buildGrid() {
    if (observer) observer.kill()
    setStatus("loading")
    collection.innerHTML = ""

    const measureItem = originalItems[0].cloneNode(true) as HTMLElement
    measureItem.style.position = "absolute"
    measureItem.style.visibility = "hidden"
    measureItem.style.pointerEvents = "none"
    wrapper.appendChild(measureItem)

    const itemRect = measureItem.getBoundingClientRect()
    const itemWidth = itemRect.width
    const itemHeight = itemRect.height

    measureItem.remove()

    if (!itemWidth || !itemHeight) return

    const columns = Math.max(
      1,
      Math.ceil(wrapper.clientWidth / itemWidth) + 1
    )
    const rows = Math.max(1, Math.ceil(wrapper.clientHeight / itemHeight) + 1)
    const requiredItems = columns * rows
    const wantedItems = Math.max(requiredItems, originalItems.length)
    const itemsPerList = Math.ceil(wantedItems / columns) * columns
    const fragment = document.createDocumentFragment()

    for (let listIndex = 0; listIndex < 4; listIndex++) {
      const list = sourceList.cloneNode(false) as HTMLElement
      list.style.setProperty("--grid-columns", String(columns))
      list.style.display = "grid"

      if (listIndex > 0) {
        list.setAttribute("aria-hidden", "true")
      }

      for (let itemIndex = 0; itemIndex < itemsPerList; itemIndex++) {
        const item = originalItems[
          itemIndex % originalItems.length
        ].cloneNode(true) as HTMLElement
        if (listIndex > 0) item.setAttribute("aria-hidden", "true")
        list.appendChild(item)
      }
      fragment.appendChild(list)
    }

    collection.appendChild(fragment)
    requestAnimationFrame(setGrid)
  }

  function setGrid() {
    const lists = Array.from(
      collection.querySelectorAll<HTMLElement>("[data-infinite-grid-list]")
    )
    const firstList = lists[0]
    if (!firstList) return

    const firstItem = firstList.querySelector<HTMLElement>(
      "[data-infinite-grid-item]"
    )
    if (!firstItem) return

    const listRect = firstList.getBoundingClientRect()
    const itemRect = firstItem.getBoundingClientRect()

    tileWidth = listRect.width
    tileHeight = listRect.height

    const itemHeight = itemRect.height

    gsap.set(lists[0], { xPercent: 0, yPercent: 0 })
    gsap.set(lists[1], { xPercent: 100, yPercent: 0 })
    gsap.set(lists[2], { xPercent: 0, yPercent: 100 })
    gsap.set(lists[3], { xPercent: 100, yPercent: 100 })

    const wrapX = gsap.utils.wrap(-tileWidth, 0)
    const wrapY = gsap.utils.wrap(-tileHeight, 0)

    currentX = wrapX((wrapper.clientWidth - tileWidth) * 0.5)
    currentY = wrapY((wrapper.clientHeight - itemHeight) * 0.5)

    xTo = gsap.quickTo(collection, "x", {
      duration: 1.2,
      ease: "expo.out",
      modifiers: {
        x: gsap.utils.unitize(wrapX),
      },
    })

    yTo = gsap.quickTo(collection, "y", {
      duration: 1.2,
      ease: "expo.out",
      modifiers: {
        y: gsap.utils.unitize(wrapY),
      },
    })

    gsap.set(collection, {
      x: currentX,
      y: currentY,
    })

    requestAnimationFrame(() => {
      setStatus("idle")
    })

    observer = Observer.create({
      target: wrapper,
      type: "wheel,touch,pointer",
      preventDefault: true,
      dragMinimum: 3,
      onPress(self) {
        dragMoved = false
        const target = self.event.target as Element | null
        pressedHref =
          target
            ?.closest<HTMLElement>("[data-infinite-grid-item]")
            ?.getAttribute("data-href") ?? null
        setStatus("dragging")
      },
      onRelease() {
        setStatus("idle")
        // A genuine tap (no drag) navigates. Done here rather than on `click`
        // because Observer's preventDefault suppresses the click on touch.
        if (!dragMoved && pressedHref) navigate(pressedHref)
        pressedHref = null
      },
      onStop() {
        setStatus("idle")
      },
      onChangeX(self) {
        handleMovement(self, "x")
      },
      onChangeY(self) {
        handleMovement(self, "y")
      },
    })

    if (!hasMouseLeaveListener) {
      document.documentElement.addEventListener("mouseleave", handleMouseLeave)
      hasMouseLeaveListener = true
    }
  }

  function handleMouseLeave() {
    setStatus("idle")
    if (observer) {
      observer.disable()
      observer.enable()
    }
  }

  function handleMovement(self: Observer, axis: "x" | "y") {
    const isWheel = self.event.type === "wheel"

    if (isWheel) {
      setStatus("scrolling")
      if (scrollTimeout) clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        setStatus("idle")
      }, 200)
    } else {
      // A real pointer/touch drag occurred — suppress the trailing click.
      dragMoved = true
    }

    const multiplier = isWheel ? wheelSpeed : dragSpeed
    const deltaSource =
      axis === "x" ? self.deltaX : self.deltaY
    const delta = gsap.utils.clamp(-80, 80, deltaSource * multiplier)

    if (axis === "x") {
      currentX += isWheel ? -delta : delta
      xTo?.(currentX)
    } else {
      currentY += isWheel ? -delta : delta
      yTo?.(currentY)
    }
  }

  function onClickCapture(event: MouseEvent) {
    // Navigation is handled in Observer.onRelease (works on touch too). Here we
    // only cancel the native click so the cloned PostCard's inner <a> doesn't
    // trigger a second, full-page navigation on desktop.
    const target = event.target as Element | null
    if (!target?.closest("[data-infinite-grid-item]")) return
    event.preventDefault()
    event.stopPropagation()
  }

  function onResize() {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      buildGrid()
    }, 200)
  }

  window.addEventListener("resize", onResize)
  wrapper.addEventListener("click", onClickCapture, true)

  buildGrid()

  return () => {
    observer?.kill()
    window.removeEventListener("resize", onResize)
    wrapper.removeEventListener("click", onClickCapture, true)
    if (hasMouseLeaveListener) {
      document.documentElement.removeEventListener(
        "mouseleave",
        handleMouseLeave
      )
    }
    if (resizeTimer) clearTimeout(resizeTimer)
    if (scrollTimeout) clearTimeout(scrollTimeout)
    collection.innerHTML = ""
  }
}

export function InfiniteGrid({
  items,
  className,
  wheelSpeed = 0.75,
  dragSpeed = 1.25,
}: InfiniteGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  )

  // Stable identity for the rendered set so the effect re-inits only on change.
  const itemsKey = items.map((item) => item.key).join("|")

  useEffect(() => {
    if (reducedMotion) return
    const container = containerRef.current
    if (!container || items.length < 1) return

    registerGsap()

    return initInfiniteGrid(container, {
      wheelSpeed,
      dragSpeed,
      navigate: (href) => router.push(href),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, itemsKey, wheelSpeed, dragSpeed])

  if (items.length < 1) return null

  if (reducedMotion) {
    return (
      <div className={cn(styles.reducedMotionGrid, className)}>
        {items.map((item) => (
          <div key={item.key} className={styles.reducedMotionCard}>
            {item.node}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      data-infinite-grid-init
      data-infinite-grid-status="loading"
      className={cn(styles.grid, className)}
    >
      <div data-infinite-grid-collection className={styles.collection} />
      <div
        data-infinite-grid-list
        aria-hidden
        className={styles.list}
        style={{ display: "none" }}
      >
        {items.map((item) => (
          <div
            key={item.key}
            data-infinite-grid-item
            data-href={item.href}
            className={styles.item}
          >
            <div className={styles.card}>{item.node}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
