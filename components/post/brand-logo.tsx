"use client"

import { useState } from "react"

import { brandLogoUrls } from "@/lib/brands/logo-url"
import { getBrand } from "@/lib/brands/get-brand"
import type { ToolSlug } from "@/lib/dummy/posts"
import { cn } from "@/lib/utils"

/**
 * Fixed 2rem × 2rem headline logo box (0.5rem radius). Asset from Storage;
 * falls back to /public/brands/{slug}/logo.svg when Storage is empty.
 */
export function BrandLogo({
  slug,
  label,
  className,
}: {
  slug: ToolSlug
  label: string
  className?: string
}) {
  const brand = getBrand(slug)
  const { storage, fallback } = brandLogoUrls(brand)
  const [src, setSrc] = useState(storage)

  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[0.5rem] bg-white ring-1 ring-black/10",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={32}
        height={32}
        className="size-full object-contain p-0.5"
        onError={() => {
          if (src !== fallback) setSrc(fallback)
        }}
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}
