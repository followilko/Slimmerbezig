import type { ToolSlug } from "@/lib/dummy/posts"

/** Stable id for post card branding (#BRAND-ID). Matches `tags.slug` where kind = tool. */
export type BrandSlug = ToolSlug

/**
 * Raw manifest row — only set `primary` + `secondary`; text colors are derived
 * unless you pass optional `on*` overrides.
 */
export type BrandManifestEntry = {
  slug: BrandSlug
  label: string
  /** Category pill (e.g. "Mini hack") */
  primary: string
  /** Card body background */
  secondary: string
  /** Object key inside Supabase bucket `brand-assets` */
  logoPath: string
  /** Manual override when auto contrast isn't right */
  onPrimary?: string
  onSecondary?: string
  onSecondaryMuted?: string
}

/** Fully resolved tokens (used by components). */
export type BrandDefinition = BrandManifestEntry & {
  onPrimary: string
  onSecondary: string
  onSecondaryMuted: string
}

export type BrandSlugInput = BrandSlug | string | null | undefined
