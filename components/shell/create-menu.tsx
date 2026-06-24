"use client"

import { Menu as BaseMenu } from "@base-ui/react/menu"
import { Lightbulb, Plus, Sparkles } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { COMPOSE_PARAM, COMPOSE_HACK } from "@/components/post/post-maker/compose-param"
import { cn } from "@/lib/utils"

export function CreateMenu() {
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
          "inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground px-3 text-xs font-semibold text-background",
          "transition-colors hover:bg-foreground/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        )}
      >
        <Plus className="size-4" />
        Create
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
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  )
}
