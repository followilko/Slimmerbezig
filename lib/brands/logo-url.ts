import { env } from "@/lib/env"

import type { BrandDefinition } from "./types"

export const BRAND_ASSETS_BUCKET = "brand-assets"

/** Public Supabase Storage URL for a brand logo object. */
export function brandLogoStorageUrl(logoPath: string): string {
  const base = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")
  return `${base}/storage/v1/object/public/${BRAND_ASSETS_BUCKET}/${logoPath}`
}

/** Local dev fallback when Storage object is missing (same slug layout). */
export function brandLogoFallbackUrl(brand: BrandDefinition): string {
  if (brand.logoPath === "_fallback/logo.svg") {
    return "/brands/_fallback/logo.svg"
  }
  return `/brands/${brand.slug}/logo.svg`
}

export function brandLogoUrls(brand: BrandDefinition) {
  return {
    storage: brandLogoStorageUrl(brand.logoPath),
    fallback: brandLogoFallbackUrl(brand),
  }
}
