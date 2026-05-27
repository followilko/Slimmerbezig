"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export const PRIMARY_NAV_ITEMS = [
  { label: "Suggested", href: "/for-you" },
  { label: "Peers", href: "/office" },
  { label: "Communities", href: "/communities" },
  { label: "Explore", href: "/explore" },
] as const

export const PRIMARY_NAV_TRAILING = [
  { label: "Challenges", href: "/challenges" },
] as const

export function PrimaryNav({ className }: { className?: string }) {
  const pathname = usePathname() ?? ""

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "hidden items-center gap-1 rounded-full border border-border bg-white px-2 py-1.5 shadow-sm md:inline-flex",
        className
      )}
    >
      {PRIMARY_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          active={pathname === item.href}
        >
          {item.label}
        </NavLink>
      ))}
      <span aria-hidden className="mx-1 h-4 w-px bg-border" />
      {PRIMARY_NAV_TRAILING.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          active={pathname === item.href}
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
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
      {active ? (
        <span
          aria-hidden
          className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-foreground"
        />
      ) : null}
    </Link>
  )
}
