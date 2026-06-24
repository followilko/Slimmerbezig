"use client"

import { Menu as BaseMenu } from "@base-ui/react/menu"
import { Hash, Lightbulb, Plus, Sparkles } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { COMPOSE_PARAM, COMPOSE_HACK } from "@/components/post/post-maker/compose-param"
import { cn } from "@/lib/utils"

export function CreateMenu({
  canCreateChannels = false,
  variant = "pill",
}: {
  canCreateChannels?: boolean
  /** "pill" = header chip; "block" = full-width sidebar button */
  variant?: "pill" | "block"
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function openHackComposer() {
    const params = new URLSearchParams(searchParams.toString())
    params.set(COMPOSE_PARAM, COMPOSE_HACK)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger
        className={cn(
          "inline-flex items-center gap-1.5 bg-foreground font-semibold text-background",
          "transition-colors hover:bg-foreground/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
          variant === "block"
            ? "h-9 w-full justify-center rounded-full px-3 text-sm"
            : "h-8 rounded-full px-3 text-xs"
        )}
      >
        <Plus className="size-4" />
        {variant === "block" ? "Maken" : "Create"}
      </BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner sideOffset={8} align="end">
          <BaseMenu.Popup
            className={cn(
              "z-50 min-w-56 origin-[var(--transform-origin)] overflow-hidden rounded-xl border border-black/10 bg-white p-1 text-sm shadow-lg outline-none",
              "data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[starting-style]:scale-95",
              "transition-[opacity,transform] duration-150"
            )}
          >
            <div className="px-2.5 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Nieuw plaatsen
            </div>

            <BaseMenu.Item
              onClick={openHackComposer}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-foreground outline-none",
                "data-[highlighted]:bg-muted"
              )}
            >
              <Sparkles className="size-4 text-muted-foreground" />
              <span className="flex flex-col">
                <span className="font-medium">Hack</span>
                <span className="text-xs text-muted-foreground">
                  Maak een hack van een gesprek of link
                </span>
              </span>
            </BaseMenu.Item>

            <BaseMenu.Item
              className={cn(
                "rounded-md p-0 outline-none",
                "data-[highlighted]:bg-muted"
              )}
              render={
                <Link
                  href="/challenges/new"
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-foreground"
                >
                  <Lightbulb className="size-4 text-muted-foreground" />
                  <span className="flex flex-col">
                    <span className="font-medium">Challenge</span>
                    <span className="text-xs text-muted-foreground">
                      Vraag je peers om hulp bij X
                    </span>
                  </span>
                </Link>
              }
            />

            {canCreateChannels ? (
              <BaseMenu.Item
                className={cn(
                  "rounded-md p-0 outline-none",
                  "data-[highlighted]:bg-muted"
                )}
                render={
                  <Link
                    href="/channels/new"
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-foreground"
                  >
                    <Hash className="size-4 text-muted-foreground" />
                    <span className="flex flex-col">
                      <span className="font-medium">Channel</span>
                      <span className="text-xs text-muted-foreground">
                        Start een nieuw kanaal voor de community
                      </span>
                    </span>
                  </Link>
                }
              />
            ) : null}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  )
}
