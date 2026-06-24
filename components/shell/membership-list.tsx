"use client"

import { BellOff, Hash } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import type { ChannelOverview } from "@/lib/channels/queries"
import { cn } from "@/lib/utils"

export function MembershipList({
  channels,
}: {
  channels: ChannelOverview[]
}) {
  const pathname = usePathname() ?? ""

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-3">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Lidmaatschappen
        </span>
        <Link
          href="/channels"
          className="text-[10px] font-medium text-muted-foreground hover:text-foreground"
        >
          Alle
        </Link>
      </div>

      {channels.length === 0 ? (
        <Link
          href="/channels"
          className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
        >
          Ontdek kanalen
        </Link>
      ) : (
        <nav aria-label="Channels" className="flex flex-col gap-0.5">
          {channels.map((c) => {
            const href = `/channels/${c.slug}`
            const active = pathname === href
            return (
              <Link
                key={c.id}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-foreground/5 font-medium text-foreground"
                    : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                )}
              >
                <Hash className="size-3.5 shrink-0 opacity-70" />
                <span className="min-w-0 flex-1 truncate">{c.name}</span>
                {!c.notify ? (
                  <BellOff
                    className="size-3.5 shrink-0 opacity-60"
                    aria-label="Meldingen uit"
                  />
                ) : null}
              </Link>
            )
          })}
        </nav>
      )}
    </div>
  )
}
