import {
  pickForeground,
  pickMutedForeground,
} from "@/lib/brands/contrast"
import type { BrandDefinition, BrandManifestEntry } from "@/lib/brands/types"

/** Derive on-* text colors from background/secondary/primary for maximum contrast. */
export function resolveBrand(entry: BrandManifestEntry): BrandDefinition {
  const onBackground = entry.onBackground ?? pickForeground(entry.background)
  const onPrimary = entry.onPrimary ?? pickForeground(entry.primary)
  const onSecondary = entry.onSecondary ?? pickForeground(entry.secondary)
  const onSecondaryMuted =
    entry.onSecondaryMuted ??
    pickMutedForeground(entry.secondary, onSecondary)

  return {
    ...entry,
    onBackground,
    onPrimary,
    onSecondary,
    onSecondaryMuted,
  }
}
