"use client"

import { type ReactNode, useLayoutEffect, useRef } from "react"

import gsap from "gsap"

import ScrollTrigger from "gsap/ScrollTrigger"

import { registerGsap } from "@/lib/anim/registerGsap"

export default function Template({ children }: { children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    registerGsap()

    const el = wrapperRef.current
    if (!el) return

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches

    if (prefersReducedMotion) {
      ScrollTrigger.refresh()
      return
    }

    gsap.set(el, { opacity: 0, y: 12 })

    const ctx = gsap.context(() => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.35,
        ease: "power2.out",
        onComplete: () => {
          ScrollTrigger.refresh()
        },
      })
    }, el)

    return () => {
      ctx.revert()
    }
  }, [])

  return (
    <div ref={wrapperRef} className="w-full">
      {children}
    </div>
  )
}
