export type ChatKind = "onboarding" | "checkin"

/** Must match `profiles_sector_check` in learning_schema. */
export const SECTOR_SLUGS = [
  "design",
  "marketing",
  "sales",
  "finance",
  "product",
  "engineering",
  "operations",
  "hr",
  "other",
] as const

export type SectorSlug = (typeof SECTOR_SLUGS)[number]

export type TagRow = { id: string; slug: string; label: string; kind: string }
