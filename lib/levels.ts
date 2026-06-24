import { cache } from "react"

import { isCreator } from "@/lib/auth/role"
import type { ViewerProfile } from "@/lib/profile/get-viewer-profile"
import { createClient } from "@/lib/supabase/server"

export type LevelRow = {
  level: number
  slug: string
  name: string
  min_xp: number
  can_create_hacks: boolean
  can_create_challenges: boolean
  can_create_channels: boolean
}

export type Capabilities = {
  xp: number
  level: LevelRow | null
  canCreateHacks: boolean
  canCreateChallenges: boolean
  canCreateChannels: boolean
}

/** Levels ladder (small static-ish table), memoized per server request. */
export const getLevels = cache(async (): Promise<LevelRow[]> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("levels")
    .select(
      "level, slug, name, min_xp, can_create_hacks, can_create_challenges, can_create_channels"
    )
    .order("min_xp", { ascending: true })
  return (data ?? []) as LevelRow[]
})

/** Lifetime XP for a user (single-row read; 0 when no row yet). */
export const getXpTotal = cache(async (userId: string): Promise<number> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("user_xp")
    .select("xp")
    .eq("user_id", userId)
    .maybeSingle<{ xp: number }>()
  return data?.xp ?? 0
})

/** Highest reached level for an XP total. */
export function levelForXp(levels: LevelRow[], xp: number): LevelRow | null {
  let current: LevelRow | null = null
  for (const l of levels) {
    if (l.min_xp <= xp) current = l
  }
  return current
}

/**
 * Resolve a viewer's create-capabilities.
 *
 * Mirrors `public.user_can_create_hacks` (SQL): staff roles
 * (creator/curator/admin) bypass the XP gate; everyone else needs a level row
 * whose `min_xp` they've reached. The SQL RPC is the real enforcement — this is
 * the UI-side gate for showing/hiding the "+ Create" entry.
 */
export const getViewerCapabilities = cache(
  async (
    userId: string,
    profile: ViewerProfile | null
  ): Promise<Capabilities> => {
    const [levels, xp] = await Promise.all([getLevels(), getXpTotal(userId)])
    const reached = levels.filter((l) => l.min_xp <= xp)
    const staff = isCreator(profile)

    return {
      xp,
      level: levelForXp(levels, xp),
      canCreateHacks: staff || reached.some((l) => l.can_create_hacks),
      canCreateChallenges:
        staff || reached.some((l) => l.can_create_challenges),
      canCreateChannels: staff || reached.some((l) => l.can_create_channels),
    }
  }
)
