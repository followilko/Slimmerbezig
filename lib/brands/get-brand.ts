import type { CSSProperties } from "react"

import { BRAND_MANIFEST, isBrandSlug } from "@/lib/brands/manifest"
import { resolveBrand } from "@/lib/brands/resolve-brand"
import type { BrandDefinition, BrandSlugInput } from "@/lib/brands/types"
import type { ToolSlug } from "@/lib/dummy/posts"

const FALLBACK = resolveBrand({
  slug: "claude",
  label: "Tool",
  primary: "#C15F3C",
  secondary: "#27272A",
  logoPath: "_fallback/logo.svg",
})

/** Resolve brand tokens for a tool slug (sync, no network). */
export function getBrand(slug: BrandSlugInput): BrandDefinition {
  if (!slug || !isBrandSlug(slug)) return FALLBACK
  const entry = BRAND_MANIFEST[slug as ToolSlug]
  if (!entry) return FALLBACK
  return resolveBrand(entry)
}

/** CSS custom properties for a post card root element. */
export function brandCardStyle(brand: BrandDefinition): CSSProperties {
  return {
    ["--post-brand-primary" as string]: brand.primary,
    ["--post-brand-on-primary" as string]: brand.onPrimary,
    ["--post-brand-secondary" as string]: brand.secondary,
    ["--post-brand-on-secondary" as string]: brand.onSecondary,
    ["--post-brand-on-secondary-muted" as string]: brand.onSecondaryMuted,
    backgroundColor: brand.secondary,
    color: brand.onSecondary,
  }
}

export { BRAND_MANIFEST }
