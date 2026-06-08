import { Wind } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"

export function BrandMark({
  href = "/for-you",
  className,
  embedded = false,
}: {
  href?: string
  className?: string
  /** Inside the primary nav pill — no separate circle chrome */
  embedded?: boolean
}) {
  return (
    <Link
      href={href}
      aria-label="Slimmerbezig home"
      className={cn(
        embedded
          ? "inline-flex h-full shrink-0 items-center text-foreground"
          : "inline-flex size-[3.75rem] shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-foreground",
        className
      )}
    >
      <Wind className="size-5" strokeWidth={2.25} />
    </Link>
  )
}
