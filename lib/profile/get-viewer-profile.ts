import { cache } from "react"

import { createClient } from "@/lib/supabase/server"

export type ProfileRole = "learner" | "creator" | "curator" | "admin"

export type ViewerProfile = {
  id: string
  full_name: string | null
  given_name: string | null
  family_name: string | null
  email: string | null
  avatar_url: string | null
  locale: string | null
  sector: string | null
  role: ProfileRole | null
  onboarded_at: string | null
  linkedin_url: string | null
}

export type ViewerSnapshot = {
  userId: string
  profile: ViewerProfile | null
}

/**
 * Fetches the signed-in user's profile, memoized per server request via
 * React's `cache()`. Multiple callers in the same request (layout + page +
 * components) all hit the DB once.
 *
 * Returns `null` when there is no signed-in user — callers decide whether
 * to redirect.
 */
export const getViewer = cache(async (): Promise<ViewerSnapshot | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, given_name, family_name, email, avatar_url, locale, sector, role, onboarded_at, linkedin_url"
    )
    .eq("id", user.id)
    .maybeSingle<ViewerProfile>()

  return { userId: user.id, profile: profile ?? null }
})

/** Saved-hacks count for the favorites badge; memoized for the same request. */
export const getSavedCount = cache(async (userId: string): Promise<number> => {
  const supabase = await createClient()
  const { count } = await supabase
    .from("hack_interactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", "saved")

  return count ?? 0
})

export function displayNameFor(profile: ViewerProfile | null): string | null {
  const name =
    profile?.full_name?.trim() ||
    [profile?.given_name, profile?.family_name]
      .filter(Boolean)
      .join(" ")
      .trim()
  return name && name.length > 0 ? name : null
}

export function initialsFor(profile: ViewerProfile | null): string {
  const name = displayNameFor(profile)
  if (name) {
    const parts = name.split(/\s+/).slice(0, 2)
    return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "U"
  }
  const emailFirst = profile?.email?.trim()?.charAt(0)
  return emailFirst?.toUpperCase() ?? "U"
}
