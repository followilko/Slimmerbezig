"use client"

import { Menu as BaseMenu } from "@base-ui/react/menu"
import {
  GraduationCap,
  LogOut,
  MessageSquare,
  Settings,
  Menu as MenuIcon,
  Sparkles,
} from "lucide-react"
import Link from "next/link"

import { signOut } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import {
  PRIMARY_NAV_ITEMS,
  PRIMARY_NAV_TRAILING,
} from "@/components/shell/primary-nav"
import { cn } from "@/lib/utils"

type Item = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const SECONDARY_ITEMS: ReadonlyArray<Item> = [
  { label: "Account settings", href: "/settings", icon: Settings },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Learning path", href: "/learning-path", icon: GraduationCap },
]

export function HamburgerMenu({ isCreator }: { isCreator: boolean }) {
  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label="Open menu"
            className="rounded-full border-border bg-white"
          >
            <MenuIcon className="size-4" />
          </Button>
        }
      />
      <BaseMenu.Portal>
        <BaseMenu.Positioner sideOffset={8} align="end">
          <BaseMenu.Popup
            className={cn(
              "z-50 min-w-56 origin-[var(--transform-origin)] overflow-hidden rounded-xl border border-border bg-white p-1 text-sm shadow-lg outline-none",
              "data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[starting-style]:scale-95",
              "transition-[opacity,transform] duration-150"
            )}
          >
            <div className="md:hidden">
              <Section label="Browse">
                {PRIMARY_NAV_ITEMS.map((i) => (
                  <MenuLink key={i.href} href={i.href}>
                    {i.label}
                  </MenuLink>
                ))}
                {PRIMARY_NAV_TRAILING.map((i) => (
                  <MenuLink key={i.href} href={i.href}>
                    {i.label}
                  </MenuLink>
                ))}
              </Section>
              <Separator />
            </div>

            <Section>
              {SECONDARY_ITEMS.map((i) => (
                <MenuLink key={i.href} href={i.href} icon={i.icon}>
                  {i.label}
                </MenuLink>
              ))}
              {!isCreator ? (
                <MenuLink href="/become-a-creator" icon={Sparkles}>
                  Become a creator
                </MenuLink>
              ) : null}
            </Section>

            <Separator />

            <Section>
              <BaseMenu.Item
                className={cn(
                  "w-full rounded-md p-0 text-left outline-none",
                  "data-[highlighted]:bg-muted"
                )}
                render={
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-destructive"
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </button>
                  </form>
                }
              />
            </Section>
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  )
}

function Section({
  children,
  label,
}: {
  children: React.ReactNode
  label?: string
}) {
  return (
    <div className="py-1">
      {label ? (
        <div className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
      ) : null}
      {children}
    </div>
  )
}

function Separator() {
  return <div aria-hidden className="my-1 h-px bg-border" />
}

function MenuLink({
  href,
  icon: Icon,
  children,
}: {
  href: string
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <BaseMenu.Item
      className={cn(
        "rounded-md p-0 outline-none",
        "data-[highlighted]:bg-muted"
      )}
      render={
        <Link
          href={href}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-foreground"
        >
          {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
          {children}
        </Link>
      }
    />
  )
}
