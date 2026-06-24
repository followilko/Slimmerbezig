"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

export type PublishHackInput = {
  title: string
  summary: string
  bodyMd: string
  postType: string
  toolSlug: string | null
  estimatedMinutes: number | null
  goal: string | null
  tagSlugs: string[]
  channelIds: string[]
}

export type PublishHackResult = {
  ok: boolean
  hackId?: string
  reason?: string
}

/**
 * Publishes a user hack via the SECURITY DEFINER `publish_hack` RPC, which
 * atomically inserts the hack, links tags + channels (>= 1 required), and
 * awards 250 XP. The capability gate + XP award live in SQL so they can't be
 * forged from the client.
 */
export async function publishHack(
  input: PublishHackInput
): Promise<PublishHackResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: "unauthenticated" }

  const title = input.title.trim()
  if (title.length < 3) return { ok: false, reason: "title_required" }
  if (!input.channelIds?.length) return { ok: false, reason: "channel_required" }

  const { data, error } = await supabase.rpc("publish_hack", {
    p_title: title,
    p_summary: input.summary?.trim() || null,
    p_body_md: input.bodyMd ?? "",
    p_post_type: input.postType || "recipe",
    p_tool_slug: input.toolSlug,
    p_estimated_minutes: input.estimatedMinutes,
    p_goal: input.goal,
    p_tag_slugs: input.tagSlugs ?? [],
    p_channel_ids: input.channelIds,
  })

  if (error) return { ok: false, reason: error.message }

  revalidatePath("/for-you")
  revalidatePath("/explore")
  revalidatePath("/profile")
  return { ok: true, hackId: data as string }
}
