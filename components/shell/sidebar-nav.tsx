"use client"

import {
  BookOpen,
  GraduationCap,
  Home,
  Lightbulb,
  Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Home", href: "/for-you", icon: Home },
  { label: "Learning Path", href: "/learning-path", icon: GraduationCap },
  { label: "Peers", href: "/office", icon: Users },
  { label: "Knowledge base", href: "/explore", icon: BookOpen },
  { label: "Challenges", href: "/challenges", icon: Lightbulb },
] as const

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SidebarNav() {
  const pathname = usePathname() ?? ""

  return (
    <nav aria-label="Primary" className="flex flex-col gap-0.5">
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const active = isActive(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-foreground/5 text-foreground"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
