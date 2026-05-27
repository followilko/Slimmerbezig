import type { SimpleIcon } from "simple-icons"
import {
  siClaude,
  siCursor,
  siFigma,
  siFramer,
  siNotion,
  siZoom,
} from "simple-icons"

import type { ToolSlug } from "@/lib/dummy/posts"
import { cn } from "@/lib/utils"

/** Brands absent from simple-icons — minimal path + official hex. */
const CUSTOM_TOOL_ICONS: Record<"photoshop", SimpleIcon> = {
  photoshop: {
    title: "Adobe Photoshop",
    slug: "photoshop",
    hex: "31A8FF",
    path: "M13.966 22.624l-1.69-4.281H8.122l-1.69 4.281H4.008L9.775 1.376h2.448l5.769 21.248h-4.026zM8.884 16.876h3.515L10.641 9.9l-1.757 6.976zm6.086-7.374c0-1.288.458-2.288 1.374-3.001.916-.713 2.15-1.069 3.702-1.069 1.288 0 2.288.286 3.001.858.713.572 1.069 1.401 1.069 2.487 0 .858-.286 1.573-.858 2.144-.572.572-1.401.858-2.487.858h-1.717v2.487h-2.144V9.502zm2.144 0h1.717c.858 0 1.487-.143 1.888-.429.401-.286.601-.744.601-1.373 0-.572-.172-1.001-.515-1.287-.344-.286-.858-.429-1.545-.429-.687 0-1.201.143-1.545.429-.344.286-.516.715-.516 1.287v2.002z",
    svg: "",
    source: "https://www.adobe.com/products/photoshop.html",
  },
}

const TOOL_ICONS: Record<ToolSlug, SimpleIcon> = {
  photoshop: CUSTOM_TOOL_ICONS.photoshop,
  figma: siFigma,
  framer: siFramer,
  notion: siNotion,
  zoom: siZoom,
  cursor: siCursor,
  claude: siClaude,
}

export function ToolIcon({
  slug,
  mono = false,
  className,
  size = "md",
}: {
  slug: ToolSlug
  mono?: boolean
  className?: string
  size?: "sm" | "md"
}) {
  const icon = TOOL_ICONS[slug]
  const fill = mono ? "currentColor" : `#${icon.hex}`
  const box = size === "sm" ? "size-4" : "size-5"

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[4px]",
        !mono && "bg-white p-0.5 ring-1 ring-border/40",
        box,
        className
      )}
      aria-hidden
    >
      <svg
        role="img"
        viewBox="0 0 24 24"
        className="size-full"
        aria-label={icon.title}
      >
        <path d={icon.path} fill={fill} />
      </svg>
    </span>
  )
}
