import { cn } from "@/lib/utils"

/** Wrapper for Boxicons from `public/icons/*.svg` — uses currentColor. */
export function PostCardSvg({
  className,
  children,
  fill = "currentColor",
}: {
  className?: string
  children: React.ReactNode
  fill?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-6 shrink-0", className)}
      fill={fill}
      aria-hidden
    >
      {children}
    </svg>
  )
}
