import type { BrandManifestEntry, BrandSlug } from "@/lib/brands/types"

/**
 * **Single source of truth for per-tool post-card styling.**
 *
 * Each row controls one tool's card look. Set the three surface colors and the
 * logo; text colors are auto-derived for contrast (override with `on*` only
 * when needed). Adding a tool = add a row here (+ extend `ToolSlug`) — no
 * per-card code.
 *
 * | Field        | Controls (see docs/design-system.md numbered mock) |
 * |--------------|----------------------------------------------------|
 * | `background` | #1 Background light — container behind the card + hack detail bg |
 * | `secondary`  | #2 Card body background |
 * | `primary`    | #3 Hack-type pill background (`onPrimary` = pill text) |
 * | `logoBg`     | #5 Logo box background (`logoStroke` = optional border) |
 * | `logoPath`   | #5 Logo file in `public/brands/` + bucket `brand-assets` |
 *
 * #4 (duration pill) auto-flips light/dark from the card body — no config.
 */
export const BRAND_MANIFEST: Record<BrandSlug, BrandManifestEntry> = {
  cursor: {
    slug: "cursor",
    label: "Cursor",
    background: "#ECECEC",
    secondary: "#141414",
    primary: "#F5F5F5",
    onPrimary: "#141414",
    logoBg: "#FFFFFF",
    logoPath: "logo-cursor.svg",
  },
  photoshop: {
    slug: "photoshop",
    label: "Photoshop",
    background: "#DCE7F5",
    secondary: "#001E36",
    primary: "#31A8FF",
    logoBg: "#001E36",
    logoStroke: "rgba(255,255,255,0.25)",
    logoPath: "logo-photoshop.svg",
  },
  figma: {
    slug: "figma",
    label: "Figma",
    background: "#EFE7FB",
    secondary: "#1E1E1E",
    primary: "#A259FF",
    logoBg: "#FFFFFF",
    logoPath: "logo-figma.svg",
  },
  framer: {
    slug: "framer",
    label: "Framer",
    background: "#E4E9FF",
    secondary: "#111111",
    primary: "#0055FF",
    logoBg: "#FFFFFF",
    logoPath: "logo-framer.svg",
  },
  dovetail: {
    slug: "dovetail",
    label: "Dovetail",
    background: "#F5F5F5",
    secondary: "#111114",
    primary: "#2D6BFF",
    logoBg: "#FFFFFF",
    logoPath: "logo-dovetail.svg",
  },
  lovable: {
    slug: "lovable",
    label: "Lovable",
    background: "#F6ECE6",
    secondary: "#1A1614",
    primary: "#F2557D",
    onPrimary: "#FFFFFF",
    logoBg: "#FFFFFF",
    logoPath: "logo-lovable@2x.png",
  },

  // --- Legacy tools (no longer in the seed; kept so older tagged hacks still
  // resolve a brand. Safe to remove once nothing references them). ---
  claude: {
    slug: "claude",
    label: "Claude",
    background: "#EFEAE2",
    secondary: "#262624",
    primary: "#C15F3C",
    logoBg: "#D97757",
    logoPath: "logo-claude.svg",
  },
  notion: {
    slug: "notion",
    label: "Notion",
    background: "#F1F0EE",
    secondary: "#191919",
    primary: "#FFFFFF",
    onPrimary: "#191919",
    logoBg: "#FFFFFF",
    logoPath: "logo-notion.svg",
  },
  zoom: {
    slug: "zoom",
    label: "Zoom",
    background: "#DCEAFF",
    secondary: "#0B1F33",
    primary: "#0B5CFF",
    logoBg: "#FFFFFF",
    logoPath: "logo-zoom.svg",
  },
}

export function isBrandSlug(slug: string): slug is BrandSlug {
  return slug in BRAND_MANIFEST
}
