"use client"

import { useState } from "react"

import { brandLogoUrls } from "@/lib/brands/logo-url"
import { getBrand } from "@/lib/brands/get-brand"
import type { ToolSlug } from "@/lib/dummy/posts"
import { cn } from "@/lib/utils"

/**
 * Fixed 2rem × 2rem headline logo box (0.5rem radius). Box color + optional
 * stroke come from the manifest (`logoBg` / `logoStroke`). Asset loads from the
 * flat `public/brands/{logoPath}` file, falling back to Storage then a generic
 * placeholder.
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
  const GENERIC_FALLBACK = "/brands/_fallback/logo.svg"
  // Try flat public asset → Storage → generic placeholder, in order.
  const sources = Array.from(new Set([fallback, storage, GENERIC_FALLBACK]))
  const [sourceIndex, setSourceIndex] = useState(0)

  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[0.5rem]",
        className
      )}
      style={{
        backgroundColor: brand.logoBg,
        border: brand.logoStroke ? `1px solid ${brand.logoStroke}` : undefined,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sources[sourceIndex]}
        alt=""
        width={32}
        height={32}
        className="size-full object-contain p-1.5"
        onError={() => {
          setSourceIndex((i) => (i < sources.length - 1 ? i + 1 : i))
        }}
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}
