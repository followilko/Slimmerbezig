import type { CSSProperties } from "react"

import { BRAND_MANIFEST, isBrandSlug } from "@/lib/brands/manifest"
import { resolveBrand } from "@/lib/brands/resolve-brand"
import type { BrandDefinition, BrandSlugInput } from "@/lib/brands/types"
import type { ToolSlug } from "@/lib/dummy/posts"

const FALLBACK = resolveBrand({
  slug: "claude",
  label: "Tool",
  background: "#F4F2EE",
  secondary: "#27272A",
  primary: "#C15F3C",
  logoBg: "#FFFFFF",
  logoPath: "_fallback/logo.svg",
})

/** Resolve brand tokens for a tool slug (sync, no network). */
export function getBrand(slug: BrandSlugInput): BrandDefinition {
  if (!slug || !isBrandSlug(slug)) return FALLBACK
  const entry = BRAND_MANIFEST[slug as ToolSlug]
  if (!entry) return FALLBACK
  return resolveBrand(entry)
}

/** All `--post-brand-*` custom properties for a brand (cascade to children). */
export function brandVars(brand: BrandDefinition): CSSProperties {
  return {
    ["--post-brand-background" as string]: brand.background,
    ["--post-brand-on-background" as string]: brand.onBackground,
    ["--post-brand-primary" as string]: brand.primary,
    ["--post-brand-on-primary" as string]: brand.onPrimary,
    ["--post-brand-secondary" as string]: brand.secondary,
    ["--post-brand-on-secondary" as string]: brand.onSecondary,
    ["--post-brand-on-secondary-muted" as string]: brand.onSecondaryMuted,
  }
}

/**
 * Style for the card's outer container (#1 background light). Defines every
 * brand var so descendants resolve them. Reuse on the hack detail page bg.
 */
export function brandStageStyle(brand: BrandDefinition): CSSProperties {
  return {
    ...brandVars(brand),
    backgroundColor: brand.background,
    color: brand.onBackground,
  }
}

/** Style for the card body (#2 secondary). Reads vars from the stage above. */
export function brandCardStyle(brand: BrandDefinition): CSSProperties {
  return {
    ...brandVars(brand),
    backgroundColor: brand.secondary,
    color: brand.onSecondary,
  }
}

export { BRAND_MANIFEST }
