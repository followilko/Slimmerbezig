"use client"

import { useEffect, type ReactNode } from "react"

import Lenis from "lenis"

import gsap from "gsap"
import ScrollTrigger from "gsap/ScrollTrigger"

import { registerGsap } from "@/lib/anim/registerGsap"

type Props = {
  children: ReactNode
}

export function SmoothScrollProvider({ children }: Props) {
  useEffect(() => {
    registerGsap()

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches

    const lenis = new Lenis({
      autoRaf: false,
      smoothWheel: !prefersReducedMotion,
    })

    const onScroll = () => {
      ScrollTrigger.update()
    }
    lenis.on("scroll", onScroll)

    const tickerFn = (time: number) => {
      lenis.raf(time * 1000)
    }

    gsap.ticker.add(tickerFn)
    gsap.ticker.lagSmoothing(0)

    ScrollTrigger.refresh()

    return () => {
      gsap.ticker.remove(tickerFn)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.off("scroll", onScroll)
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}
