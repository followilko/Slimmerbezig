import type { BrandManifestEntry, BrandSlug } from "@/lib/brands/types"

/**
 * **Configure post tool brands here.**
 *
 * Set `primary` (category pill) + `secondary` (card background) only.
 * Text colors (`onPrimary`, `onSecondary`, `onSecondaryMuted`) are computed
 * automatically for highest contrast — override only when needed.
 *
 * Logos: Supabase Storage bucket `brand-assets` at `logoPath`.
 */
export const BRAND_MANIFEST: Record<BrandSlug, BrandManifestEntry> = {
  claude: {
    slug: "claude",
    label: "Claude",
    primary: "#C15F3C",
    secondary: "#262624",
    logoPath: "claude/logo.svg",
  },
  photoshop: {
    slug: "photoshop",
    label: "Photoshop",
    primary: "#31A8FF",
    secondary: "#001E36",
    logoPath: "photoshop/logo.svg",
  },
  figma: {
    slug: "figma",
    label: "Figma",
    primary: "#A259FF",
    secondary: "#1E1E1E",
    logoPath: "figma/logo.svg",
  },
  framer: {
    slug: "framer",
    label: "Framer",
    primary: "#0055FF",
    secondary: "#111111",
    logoPath: "framer/logo.svg",
  },
  notion: {
    slug: "notion",
    label: "Notion",
    primary: "#FFFFFF",
    secondary: "#191919",
    logoPath: "notion/logo.svg",
    onPrimary: "#191919",
  },
  zoom: {
    slug: "zoom",
    label: "Zoom",
    primary: "#0B5CFF",
    secondary: "#0B1F33",
    logoPath: "zoom/logo.svg",
  },
  cursor: {
    slug: "cursor",
    label: "Cursor",
    primary: "#F5F5F5",
    secondary: "#141414",
    logoPath: "cursor/logo.svg",
    onPrimary: "#141414",
  },
}

export function isBrandSlug(slug: string): slug is BrandSlug {
  return slug in BRAND_MANIFEST
}
