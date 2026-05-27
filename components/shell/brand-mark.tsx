import { Wind } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"

export function BrandMark({
  href = "/for-you",
  className,
}: {
  href?: string
  className?: string
}) {
  return (
    <Link
      href={href}
      aria-label="Slimmerbezig home"
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-sm transition-shadow hover:shadow",
        className
      )}
    >
      <Wind className="size-5" strokeWidth={2.25} />
    </Link>
  )
}
