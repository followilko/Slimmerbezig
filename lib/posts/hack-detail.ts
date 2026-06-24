import { getPostMeta } from "@/lib/dummy/posts"
import { buildPostFromHackRow, type AuthorLite } from "@/lib/posts/build-post"
import { createClient } from "@/lib/supabase/server"

export type HackDetailRow = {
  id: string
  title: string
  summary: string | null
  body_md: string
  status: string
  source: string
  created_at: string
  updated_at: string
  post_type: string | null
  primary_tool_slug: string | null
  estimated_minutes: number | null
  goal: string | null
  author_id: string | null
}

export type HackStats = {
  like_count: number
  save_count: number
  comment_count: number
}

export type HackTag = {
  slug: string
  label: string
  kind: string
}

export type HackChannel = {
  id: string
  slug: string
  name: string
}

export type HackCommentRow = {
  id: string
  hack_id: string
  author_id: string
  parent_comment_id: string | null
  body_md: string
  is_tip: boolean
  like_count: number
  created_at: string
  updated_at: string
  author: AuthorLite
  liked_by_viewer: boolean
}

const HACK_DETAIL_COLUMNS =
  "id, title, summary, body_md, status, source, created_at, updated_at, post_type, primary_tool_slug, estimated_minutes, goal, author_id"

export async function loadHackDetail(id: string): Promise<HackDetailRow | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("hacks")
    .select(HACK_DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle<HackDetailRow>()
  return data
}

export async function loadHackStats(hackId: string): Promise<HackStats> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("hack_stats")
    .select("like_count, save_count, comment_count")
    .eq("hack_id", hackId)
    .maybeSingle<HackStats>()
  return data ?? { like_count: 0, save_count: 0, comment_count: 0 }
}

export async function loadHackStatsMap(
  hackIds: string[]
): Promise<Map<string, HackStats>> {
  const map = new Map<string, HackStats>()
  if (hackIds.length === 0) return map

  const supabase = await createClient()
  const { data } = await supabase
    .from("hack_stats")
    .select("hack_id, like_count, save_count, comment_count")
    .in("hack_id", hackIds)

  for (const row of data ?? []) {
    map.set(row.hack_id, {
      like_count: row.like_count ?? 0,
      save_count: row.save_count ?? 0,
      comment_count: row.comment_count ?? 0,
    })
  }
  return map
}

export async function loadHackTags(hackId: string): Promise<HackTag[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("hack_tags")
    .select("tags(slug, label, kind)")
    .eq("hack_id", hackId)

  return (data ?? [])
    .map((row) => {
      const tag = row.tags as unknown as HackTag | null
      return tag
    })
    .filter((t): t is HackTag => Boolean(t?.slug))
}

export async function loadHackChannels(hackId: string): Promise<HackChannel[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("hack_channels")
    .select("channels(id, slug, name)")
    .eq("hack_id", hackId)

  return (data ?? [])
    .map((row) => row.channels as unknown as HackChannel | null)
    .filter((c): c is HackChannel => Boolean(c?.id))
}

export async function loadViewerHackState(
  userId: string,
  hackId: string
): Promise<{ liked: boolean; saved: boolean }> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("hack_interactions")
    .select("kind")
    .eq("user_id", userId)
    .eq("hack_id", hackId)
    .in("kind", ["helpful", "saved"])

  let liked = false
  let saved = false
  for (const row of data ?? []) {
    if (row.kind === "helpful") liked = true
    if (row.kind === "saved") saved = true
  }
  return { liked, saved }
}

export async function loadHackComments(
  hackId: string,
  userId: string | null,
  sort: "newest" | "most_liked" = "newest"
): Promise<HackCommentRow[]> {
  const supabase = await createClient()
  const query = supabase
    .from("hack_comments")
    .select(
      "id, hack_id, author_id, parent_comment_id, body_md, is_tip, like_count, created_at, updated_at"
    )
    .eq("hack_id", hackId)

  const { data: comments } =
    sort === "most_liked"
      ? await query.order("like_count", { ascending: false }).order("created_at", { ascending: false })
      : await query.order("created_at", { ascending: false })

  if (!comments?.length) return []

  const authorIds = Array.from(new Set(comments.map((c) => c.author_id)))
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, given_name, family_name, avatar_url, headline")
    .in("id", authorIds)

  const authorMap = new Map(
    (profiles ?? []).map((p) => [p.id, p as NonNullable<AuthorLite>])
  )

  let likedSet = new Set<string>()
  if (userId) {
    const commentIds = comments.map((c) => c.id)
    const { data: likes } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .eq("user_id", userId)
      .in("comment_id", commentIds)
    likedSet = new Set((likes ?? []).map((l) => l.comment_id))
  }

  return comments.map((c) => ({
    ...c,
    author: authorMap.get(c.author_id) ?? null,
    liked_by_viewer: likedSet.has(c.id),
  }))
}

export async function loadRelatedHacks(
  hackId: string,
  authorId: string | null,
  channelIds: string[],
  tagIds: string[],
  limit = 6
): Promise<{ sameAuthor: string[]; related: string[] }> {
  const supabase = await createClient()
  const sameAuthor: string[] = []
  const related: string[] = []

  if (authorId) {
    const { data } = await supabase
      .from("hacks")
      .select("id")
      .eq("status", "published")
      .eq("author_id", authorId)
      .neq("id", hackId)
      .order("created_at", { ascending: false })
      .limit(limit)
    sameAuthor.push(...(data ?? []).map((r) => r.id))
  }

  const relatedIds = new Set<string>()

  if (channelIds.length > 0) {
    const { data } = await supabase
      .from("hack_channels")
      .select("hack_id")
      .in("channel_id", channelIds)
      .neq("hack_id", hackId)
      .limit(limit * 2)
    for (const row of data ?? []) {
      if (!sameAuthor.includes(row.hack_id)) relatedIds.add(row.hack_id)
    }
  }

  if (relatedIds.size < limit && tagIds.length > 0) {
    const { data } = await supabase
      .from("hack_tags")
      .select("hack_id")
      .in("tag_id", tagIds)
      .neq("hack_id", hackId)
      .limit(limit * 2)
    for (const row of data ?? []) {
      if (!sameAuthor.includes(row.hack_id)) relatedIds.add(row.hack_id)
    }
  }

  related.push(...Array.from(relatedIds).slice(0, limit))
  return { sameAuthor, related }
}

export async function buildDetailPost(hack: HackDetailRow, author: AuthorLite) {
  const meta = getPostMeta(hack.id)
  if (meta) return { id: hack.id, ...meta }
  return buildPostFromHackRow(hack, author)
}
