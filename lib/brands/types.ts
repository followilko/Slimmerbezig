import type { ToolSlug } from "@/lib/dummy/posts"

/** Stable id for post card branding (#BRAND-ID). Matches `tags.slug` where kind = tool. */
export type BrandSlug = ToolSlug

/**
 * Raw manifest row — the single place to set every per-tool parameter.
 *
 * Set the three surface colors:
 * - `background` = the "background light" behind the card (and reused as the
 *   hack detail page background). NOT the card body.
 * - `secondary`  = the card body background.
 * - `primary`    = the hack-type pill background.
 *
 * Text colors (`on*`) are derived for highest contrast — only set the optional
 * overrides when the auto pick isn't right.
 */
export type BrandManifestEntry = {
  slug: BrandSlug
  label: string
  /** Background light — page/container behind the card + hack detail bg */
  background: string
  /** Card body background */
  secondary: string
  /** Category / hack-type pill (e.g. "Mini hack") */
  primary: string
  /**
   * Logo file name inside `public/brands/` (and the `brand-assets` bucket).
   * Usually `logo-{slug}.svg`; PNG when unavoidable (e.g. `logo-lovable@2x.png`).
   */
  logoPath: string
  /** Background of the 2rem logo box */
  logoBg: string
  /** Optional border on the logo box (e.g. "rgba(255,255,255,0.25)") */
  logoStroke?: string
  /** Manual override when auto contrast isn't right */
  onBackground?: string
  onPrimary?: string
  onSecondary?: string
  onSecondaryMuted?: string
}

/** Fully resolved tokens (used by components). */
export type BrandDefinition = BrandManifestEntry & {
  onBackground: string
  onPrimary: string
  onSecondary: string
  onSecondaryMuted: string
}

export type BrandSlugInput = BrandSlug | string | null | undefined
