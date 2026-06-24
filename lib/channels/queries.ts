import { cache } from "react"

import {
  HACK_FEED_COLUMNS,
  type HackFeedRow,
} from "@/lib/posts/feed-items"
import { createClient } from "@/lib/supabase/server"

export type ChannelOwnerKind = "platform" | "user"

export type ChannelOverview = {
  id: string
  slug: string
  name: string
  description: string | null
  ownerKind: ChannelOwnerKind
  createdBy: string | null
  pinnedHackId: string | null
  memberCount: number
  hackCount: number
  challengeCount: number
  isMember: boolean
  notify: boolean
}

type ChannelOverviewRow = {
  id: string
  slug: string
  name: string
  description: string | null
  owner_kind: ChannelOwnerKind
  created_by: string | null
  pinned_hack_id: string | null
  member_count: number | string
  hack_count: number | string
  challenge_count: number | string
  is_member: boolean
  notify: boolean
}

function mapOverview(row: ChannelOverviewRow): ChannelOverview {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    ownerKind: row.owner_kind,
    createdBy: row.created_by,
    pinnedHackId: row.pinned_hack_id,
    memberCount: Number(row.member_count ?? 0),
    hackCount: Number(row.hack_count ?? 0),
    challengeCount: Number(row.challenge_count ?? 0),
    isMember: Boolean(row.is_member),
    notify: Boolean(row.notify),
  }
}

/**
 * All active channels with counts + the caller's membership state. Memoized per
 * request so the browse page and the sidebar membership list share one RPC.
 */
export const listChannels = cache(async (): Promise<ChannelOverview[]> => {
  const supabase = await createClient()
  const { data } = await supabase.rpc("channels_overview", { p_slug: null })
  return ((data ?? []) as ChannelOverviewRow[]).map(mapOverview)
})

export async function getChannelBySlug(
  slug: string
): Promise<ChannelOverview | null> {
  const supabase = await createClient()
  const { data } = await supabase.rpc("channels_overview", { p_slug: slug })
  const rows = ((data ?? []) as ChannelOverviewRow[]).map(mapOverview)
  return rows[0] ?? null
}

/** Channels the current user has joined (for the sidebar). */
export const getMyChannels = cache(async (): Promise<ChannelOverview[]> => {
  const all = await listChannels()
  return all.filter((c) => c.isMember)
})

/** Published hacks linked to a channel (pinned first, then newest). */
export async function getChannelHackRows(
  channelId: string,
  pinnedHackId: string | null = null
): Promise<HackFeedRow[]> {
  const supabase = await createClient()
  const { data: links } = await supabase
    .from("hack_channels")
    .select("hack_id")
    .eq("channel_id", channelId)
  const ids = (links ?? []).map((l) => l.hack_id as string)
  if (ids.length === 0) return []

  const { data } = await supabase
    .from("hacks")
    .select(HACK_FEED_COLUMNS)
    .in("id", ids)
    .eq("status", "published")
    .order("created_at", { ascending: false })
  const rows = (data ?? []) as HackFeedRow[]

  if (!pinnedHackId) return rows

  const pinned = rows.find((r) => r.id === pinnedHackId)
  const rest = rows.filter((r) => r.id !== pinnedHackId)
  return pinned ? [pinned, ...rest] : rows
}

export type ChannelChallengeRow = {
  id: string
  title: string
  body: string | null
  status: string
  created_at: string
  user_id: string
}

/** Challenges linked to a channel (newest first). */
export async function getChannelChallenges(
  channelId: string
): Promise<ChannelChallengeRow[]> {
  const supabase = await createClient()
  const { data: links } = await supabase
    .from("challenge_channels")
    .select("challenge_id")
    .eq("channel_id", channelId)
  const ids = (links ?? []).map((l) => l.challenge_id as string)
  if (ids.length === 0) return []

  const { data } = await supabase
    .from("challenges")
    .select("id, title, body, status, created_at, user_id")
    .in("id", ids)
    .order("created_at", { ascending: false })
  return (data ?? []) as ChannelChallengeRow[]
}
