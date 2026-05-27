import type { SimpleIcon } from "simple-icons"
import {
  siClaude,
  siFigma,
  siGooglegemini,
  siGooglesheets,
  siLinear,
  siNotion,
} from "simple-icons"

import type { ToolSlug } from "@/lib/dummy/posts"
import { cn } from "@/lib/utils"

/** Brands absent from simple-icons — minimal path + official hex. */
const CUSTOM_TOOL_ICONS: Record<
  "photoshop" | "chatgpt" | "microsoftexcel",
  SimpleIcon
> = {
  photoshop: {
    title: "Adobe Photoshop",
    slug: "photoshop",
    hex: "31A8FF",
    path: "M13.966 22.624l-1.69-4.281H8.122l-1.69 4.281H4.008L9.775 1.376h2.448l5.769 21.248h-4.026zM8.884 16.876h3.515L10.641 9.9l-1.757 6.976zm6.086-7.374c0-1.288.458-2.288 1.374-3.001.916-.713 2.15-1.069 3.702-1.069 1.288 0 2.288.286 3.001.858.713.572 1.069 1.401 1.069 2.487 0 .858-.286 1.573-.858 2.144-.572.572-1.401.858-2.487.858h-1.717v2.487h-2.144V9.502zm2.144 0h1.717c.858 0 1.487-.143 1.888-.429.401-.286.601-.744.601-1.373 0-.572-.172-1.001-.515-1.287-.344-.286-.858-.429-1.545-.429-.687 0-1.201.143-1.545.429-.344.286-.516.715-.516 1.287v2.002z",
    svg: "",
    source: "https://www.adobe.com/products/photoshop.html",
  },
  chatgpt: {
    title: "ChatGPT",
    slug: "chatgpt",
    hex: "10A37F",
    path: "M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.899A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.365-1.972V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.168a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z",
    svg: "",
    source: "https://openai.com/chatgpt",
  },
  microsoftexcel: {
    title: "Microsoft Excel",
    slug: "microsoftexcel",
    hex: "217346",
    path: "M23 1.5H7.75L1 8.25V23h22V1.5zM8.5 3v5.25H3.375L8.5 3zm13.5 18.75H9V10.5h13v11.25zM10.5 12v8.25h10.5V12H10.5zm1.5 1.5h3v1.5h-3v-1.5zm0 3h3v1.5h-3v-1.5zm0 3h3v1.5h-3v-1.5zm4.5-6h3v1.5h-3v-1.5zm0 3h3v1.5h-3v-1.5zm0 3h3v1.5h-3v-1.5z",
    svg: "",
    source: "https://www.microsoft.com/microsoft-365/excel",
  },
}

const TOOL_ICONS: Record<ToolSlug, SimpleIcon> = {
  photoshop: CUSTOM_TOOL_ICONS.photoshop,
  chatgpt: CUSTOM_TOOL_ICONS.chatgpt,
  microsoftexcel: CUSTOM_TOOL_ICONS.microsoftexcel,
  claude: siClaude,
  figma: siFigma,
  googlegemini: siGooglegemini,
  googlesheets: siGooglesheets,
  linear: siLinear,
  notion: siNotion,
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
