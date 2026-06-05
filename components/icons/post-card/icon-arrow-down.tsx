import { cn } from "@/lib/utils"

import { IconArrowUp } from "./icon-arrow-up"

/** Rotated BxUpArrowCircle (public/icons/BxUpArrowCircle.svg). */
export function IconArrowDown({ className }: { className?: string }) {
  return <IconArrowUp className={cn("rotate-180", className)} />
}
