import type { SupabaseClient } from "@supabase/supabase-js"

export type RecentFeedback = {
  /** Tag slugs of hacks the user marked helpful in the last 14 days. */
  helpfulTags: string[]
  /** Tag slugs of hacks the user marked not_helpful in the last 14 days. */
  notHelpfulTags: string[]
  /** How many hacks the user saved in the last 14 days. */
  savedCount: number
}

const LOOKBACK_DAYS = 14
const MAX_HACK_IDS = 60

/**
 * Snapshot of the user's explicit feedback signals in the last 14 days,
 * resolved to tag slugs so the Ask system prompt can bias find_hacks queries
 * and steer away from already-dismissed concepts.
 *
 * Cheap two-query pattern (interactions → tag joins). RLS guarantees the
 * caller only sees their own rows.
 */
export async function getRecentFeedback(
  supabase: SupabaseClient,
  userId: string
): Promise<RecentFeedback> {
  const since = new Date(
    Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000
  ).toISOString()

  const [helpfulTags, notHelpfulTags, savedCount] = await Promise.all([
    tagsForKind(supabase, userId, "helpful", since),
    tagsForKind(supabase, userId, "not_helpful", since),
    countForKind(supabase, userId, "saved", since),
  ])

  return { helpfulTags, notHelpfulTags, savedCount }
}

async function tagsForKind(
  supabase: SupabaseClient,
  userId: string,
  kind: "helpful" | "not_helpful",
  since: string
): Promise<string[]> {
  const { data: interactions, error: iErr } = await supabase
    .from("hack_interactions")
    .select("hack_id")
    .eq("user_id", userId)
    .eq("kind", kind)
    .gte("created_at", since)
    .limit(MAX_HACK_IDS)

  if (iErr || !interactions?.length) return []
  const hackIds = Array.from(
    new Set(interactions.map((i) => i.hack_id as string))
  )
  if (!hackIds.length) return []

  const { data: links, error: lErr } = await supabase
    .from("hack_tags")
    .select("tags!inner(slug)")
    .in("hack_id", hackIds)

  if (lErr || !links?.length) return []

  const slugs = new Set<string>()
  for (const row of links) {
    const tagField = (row as { tags: unknown }).tags
    if (!tagField) continue
    if (Array.isArray(tagField)) {
      for (const t of tagField) {
        const slug = (t as { slug?: string } | null)?.slug
        if (slug) slugs.add(slug)
      }
    } else {
      const slug = (tagField as { slug?: string }).slug
      if (slug) slugs.add(slug)
    }
  }
  return Array.from(slugs).slice(0, 24)
}

async function countForKind(
  supabase: SupabaseClient,
  userId: string,
  kind: "saved",
  since: string
): Promise<number> {
  const { count, error } = await supabase
    .from("hack_interactions")
    .select("hack_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", kind)
    .gte("created_at", since)
  if (error) return 0
  return count ?? 0
}
