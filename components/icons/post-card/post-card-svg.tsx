import { cn } from "@/lib/utils"

/** Wrapper for Boxicons from `public/icons/*.svg` — uses currentColor. */
export function PostCardSvg({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-6 shrink-0", className)}
      fill="currentColor"
      aria-hidden
    >
      {children}
    </svg>
  )
}
