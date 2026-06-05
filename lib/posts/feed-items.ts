import { getPostMeta, type Post } from "@/lib/dummy/posts"
import { createClient } from "@/lib/supabase/server"

export type HackFeedRow = {
  id: string
  title: string
  summary: string | null
  status: string
  created_at: string
}

export type PostCardReactions = {
  helpful: boolean
  notHelpful: boolean
}

export type FeedPostItem = {
  post: Post
  summary: string | null
  saved: boolean
  reactions: PostCardReactions
}

export async function fetchPublishedHacksFallback(
  limit = 20
): Promise<HackFeedRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("hacks")
    .select("id, title, summary, status, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit)
  return (data ?? []) as HackFeedRow[]
}

export async function fetchRecommendedHacks(
  limit = 20
): Promise<HackFeedRow[]> {
  const supabase = await createClient()
  const { data: recs } = await supabase.rpc("get_recommended_hacks", {
    p_limit: limit,
  })
  let hacks = (recs ?? []) as HackFeedRow[]
  if (hacks.length === 0) {
    hacks = await fetchPublishedHacksFallback(limit)
  }
  return hacks
}

export async function loadReactionMap(
  userId: string,
  hackIds: string[]
): Promise<Map<string, PostCardReactions>> {
  const map = new Map<string, PostCardReactions>()
  if (hackIds.length === 0) return map

  const supabase = await createClient()
  const { data } = await supabase
    .from("hack_interactions")
    .select("hack_id, kind")
    .eq("user_id", userId)
    .in("hack_id", hackIds)
    .in("kind", ["helpful", "not_helpful"])

  for (const id of hackIds) {
    map.set(id, { helpful: false, notHelpful: false })
  }
  for (const row of data ?? []) {
    const current = map.get(row.hack_id) ?? {
      helpful: false,
      notHelpful: false,
    }
    if (row.kind === "helpful") current.helpful = true
    if (row.kind === "not_helpful") current.notHelpful = true
    map.set(row.hack_id, current)
  }
  return map
}

export async function loadSavedHackIds(userId: string): Promise<Set<string>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("hack_interactions")
    .select("hack_id")
    .eq("user_id", userId)
    .eq("kind", "saved")
  return new Set((data ?? []).map((r) => r.hack_id))
}

export function buildFeedItems(
  hacks: HackFeedRow[],
  savedIds: Set<string>,
  reactionMap: Map<string, PostCardReactions>
): FeedPostItem[] {
  return hacks.flatMap((h) => {
    const meta = getPostMeta(h.id)
    if (!meta) return []
    return [
      {
        post: { id: h.id, ...meta },
        summary: h.summary,
        saved: savedIds.has(h.id),
        reactions:
          reactionMap.get(h.id) ?? { helpful: false, notHelpful: false },
      },
    ]
  })
}

export async function prepareFeedFromHacks(
  userId: string,
  hacks: HackFeedRow[]
): Promise<FeedPostItem[]> {
  const ids = hacks.map((h) => h.id)
  const [savedIds, reactionMap] = await Promise.all([
    loadSavedHackIds(userId),
    loadReactionMap(userId, ids),
  ])
  return buildFeedItems(hacks, savedIds, reactionMap)
}
