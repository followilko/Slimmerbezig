import { getPostMeta, type Post } from "@/lib/dummy/posts"
import { buildPostFromHackRow, type AuthorLite } from "@/lib/posts/build-post"
import { createClient } from "@/lib/supabase/server"

export type HackFeedRow = {
  id: string
  title: string
  summary: string | null
  status: string
  created_at: string
  post_type?: string | null
  primary_tool_slug?: string | null
  estimated_minutes?: number | null
  author_id?: string | null
}

const HACK_FEED_COLUMNS =
  "id, title, summary, status, created_at, post_type, primary_tool_slug, estimated_minutes, author_id"

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
    .select(HACK_FEED_COLUMNS)
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

/** Batch-fetch author profiles for DB-built posts (avoids N+1). */
export async function loadAuthorMap(
  authorIds: string[]
): Promise<Map<string, NonNullable<AuthorLite>>> {
  const map = new Map<string, NonNullable<AuthorLite>>()
  const ids = Array.from(new Set(authorIds.filter(Boolean)))
  if (ids.length === 0) return map

  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, given_name, family_name, avatar_url, headline")
    .in("id", ids)

  for (const row of (data ?? []) as NonNullable<AuthorLite>[]) {
    map.set(row.id, row)
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

export async function buildFeedItems(
  hacks: HackFeedRow[],
  savedIds: Set<string>,
  reactionMap: Map<string, PostCardReactions>
): Promise<FeedPostItem[]> {
  // Legacy seeds carry TS metadata; everything else (incl. user-published
  // hacks) is built from DB columns + a batched author lookup.
  const dbRowAuthorIds = hacks
    .filter((h) => !getPostMeta(h.id))
    .map((h) => h.author_id)
    .filter((id): id is string => Boolean(id))
  const authorMap = await loadAuthorMap(dbRowAuthorIds)

  return hacks.map((h) => {
    const meta = getPostMeta(h.id)
    const post: Post = meta
      ? { id: h.id, ...meta }
      : buildPostFromHackRow(h, authorMap.get(h.author_id ?? "") ?? null)
    return {
      post,
      summary: h.summary,
      saved: savedIds.has(h.id),
      reactions:
        reactionMap.get(h.id) ?? { helpful: false, notHelpful: false },
    }
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
  return await buildFeedItems(hacks, savedIds, reactionMap)
}
