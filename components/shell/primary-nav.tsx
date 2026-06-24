"use client"

import gsap from "gsap"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useLayoutEffect, useRef } from "react"

import { BrandMark } from "@/components/shell/brand-mark"
import { cn } from "@/lib/utils"

export const PRIMARY_NAV_ITEMS = [
  { label: "Suggested", href: "/for-you" },
  { label: "Peers", href: "/office" },
  { label: "Explore", href: "/explore" },
  { label: "Channels", href: "/channels" },
] as const

export const PRIMARY_NAV_TRAILING = [
  { label: "Challenges", href: "/challenges" },
] as const

const PILL_HEIGHT = 44 // px (≈2.75rem) — inset within the 3.75rem glass bar

// SSR-safe layout effect (this is a client component, but it is also rendered on
// the server for the initial HTML — avoid the useLayoutEffect warning there).
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect

export function PrimaryNav({ className }: { className?: string }) {
  const pathname = usePathname() ?? ""

  const navRef = useRef<HTMLElement | null>(null)
  const pillRef = useRef<HTMLSpanElement | null>(null)
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const hasAnimatedRef = useRef(false)

  useIsomorphicLayoutEffect(() => {
    const pill = pillRef.current
    if (!pill) return

    const move = () => {
      const activeEl = linkRefs.current[pathname]
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
      // Instant on the very first paint, on resize, or for reduced motion;
      // otherwise slide between items.
      const instant = !hasAnimatedRef.current || prefersReduced

      if (!activeEl) {
        gsap.to(pill, { opacity: 0, duration: instant ? 0 : 0.2 })
        hasAnimatedRef.current = true
        return
      }

      const target = {
        x: activeEl.offsetLeft,
        y: activeEl.offsetTop + (activeEl.offsetHeight - PILL_HEIGHT) / 2,
        width: activeEl.offsetWidth,
        opacity: 1,
      }

      if (instant) {
        gsap.set(pill, target)
      } else {
        gsap.to(pill, { ...target, duration: 0.4, ease: "power3.out" })
      }
      hasAnimatedRef.current = true
    }

    move()

    const onResize = () => {
      hasAnimatedRef.current = false // re-measure instantly on resize
      move()
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [pathname])

  const registerLink = (href: string) => (el: HTMLAnchorElement | null) => {
    linkRefs.current[href] = el
  }

  return (
    <nav
      ref={navRef}
      aria-label="Primary"
      className={cn(
        "glass-bg relative hidden h-[3.75rem] items-stretch gap-0 rounded-full px-[1em] text-white md:inline-flex",
        className
      )}
    >
      <span
        ref={pillRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 rounded-full bg-white opacity-0"
        style={{ height: PILL_HEIGHT }}
      />
      <BrandMark embedded className="z-10 mr-2 text-white" />
      {PRIMARY_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          active={pathname === item.href}
          ref={registerLink(item.href)}
        >
          {item.label}
        </NavLink>
      ))}
      <span aria-hidden className="mx-2 h-4 w-px self-center bg-white/25" />
      {PRIMARY_NAV_TRAILING.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          active={pathname === item.href}
          ref={registerLink(item.href)}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

function NavLink({
  href,
  active,
  children,
  ref,
}: {
  href: string
  active: boolean
  children: React.ReactNode
  ref: (el: HTMLAnchorElement | null) => void
}) {
  return (
    <Link
      ref={ref}
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative z-10 inline-flex h-full items-center px-3 text-sm font-medium transition-colors",
        active ? "text-zinc-900" : "text-white/70 hover:text-white"
      )}
    >
      {children}
    </Link>
  )
}
