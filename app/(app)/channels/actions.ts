"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

export type CreateChannelResult =
  | { ok: true; slug: string }
  | { ok: false; reason: "duplicate"; existingSlug: string }
  | {
      ok: false
      reason: "unauthenticated" | "not_allowed" | "name_required" | "error"
      message?: string
    }

/**
 * Creates a member channel via the SECURITY DEFINER `create_channel` RPC, which
 * gates on capability, enforces a normalized name/slug duplicate guard, and
 * awards +100 XP. On a near-duplicate the RPC raises
 * `duplicate_channel:<slug>` so we can nudge the user to join the existing one.
 */
export async function createChannel(input: {
  name: string
  description?: string | null
}): Promise<CreateChannelResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: "unauthenticated" }

  const name = input.name.trim()
  if (name.length < 3) return { ok: false, reason: "name_required" }

  const { data, error } = await supabase.rpc("create_channel", {
    p_name: name,
    p_description: input.description?.trim() || null,
    p_slug: null,
  })

  if (error) {
    const msg = error.message ?? ""
    const dup = msg.match(/duplicate_channel:([a-z0-9-]+)/)
    if (dup) return { ok: false, reason: "duplicate", existingSlug: dup[1] }
    if (msg.includes("not_allowed")) return { ok: false, reason: "not_allowed" }
    if (msg.includes("name_required"))
      return { ok: false, reason: "name_required" }
    return { ok: false, reason: "error", message: msg }
  }

  revalidatePath("/channels")
  return { ok: true, slug: data as string }
}

export type UpdateChannelResult =
  | { ok: true }
  | { ok: false; reason: "duplicate"; existingSlug: string }
  | {
      ok: false
      reason:
        | "unauthenticated"
        | "not_allowed"
        | "not_found"
        | "name_required"
        | "error"
      message?: string
    }

/**
 * Updates a user-owned channel's name and description via the SECURITY DEFINER
 * `update_channel` RPC. Only the membership owner may edit; slug is unchanged.
 */
export async function updateChannel(input: {
  slug: string
  name: string
  description?: string | null
}): Promise<UpdateChannelResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: "unauthenticated" }

  const name = input.name.trim()
  if (name.length < 3) return { ok: false, reason: "name_required" }

  const { error } = await supabase.rpc("update_channel", {
    p_slug: input.slug,
    p_name: name,
    p_description: input.description?.trim() || null,
  })

  if (error) {
    const msg = error.message ?? ""
    const dup = msg.match(/duplicate_channel:([a-z0-9-]+)/)
    if (dup) return { ok: false, reason: "duplicate", existingSlug: dup[1] }
    if (msg.includes("not_allowed")) return { ok: false, reason: "not_allowed" }
    if (msg.includes("not_found")) return { ok: false, reason: "not_found" }
    if (msg.includes("name_required"))
      return { ok: false, reason: "name_required" }
    return { ok: false, reason: "error", message: msg }
  }

  revalidatePath("/channels")
  revalidatePath(`/channels/${input.slug}`)
  return { ok: true }
}

export async function setChannelPinnedHack(input: {
  slug: string
  hackId: string | null
}): Promise<{
  ok: boolean
  reason?: "unauthenticated" | "not_allowed" | "not_found" | "error"
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: "unauthenticated" }

  const { error } = await supabase.rpc("set_channel_pinned_hack", {
    p_slug: input.slug,
    p_hack_id: input.hackId,
  })

  if (error) {
    const msg = error.message ?? ""
    if (msg.includes("not_allowed")) return { ok: false, reason: "not_allowed" }
    if (msg.includes("not_found")) return { ok: false, reason: "not_found" }
    return { ok: false, reason: "error" }
  }

  revalidatePath(`/channels/${input.slug}`)
  return { ok: true }
}

export async function joinChannel(input: {
  channelId: string
  slug: string
}): Promise<{ ok: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  const { error } = await supabase
    .from("channel_memberships")
    .upsert(
      { channel_id: input.channelId, user_id: user.id },
      { onConflict: "channel_id,user_id", ignoreDuplicates: true }
    )
  if (error) return { ok: false }

  revalidatePath("/channels")
  revalidatePath(`/channels/${input.slug}`)
  return { ok: true }
}

export async function leaveChannel(input: {
  channelId: string
  slug: string
}): Promise<{ ok: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  const { error } = await supabase
    .from("channel_memberships")
    .delete()
    .eq("channel_id", input.channelId)
    .eq("user_id", user.id)
  if (error) return { ok: false }

  revalidatePath("/channels")
  revalidatePath(`/channels/${input.slug}`)
  return { ok: true }
}

export async function setChannelNotify(input: {
  channelId: string
  slug: string
  notify: boolean
}): Promise<{ ok: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  const { error } = await supabase
    .from("channel_memberships")
    .update({ notify: input.notify })
    .eq("channel_id", input.channelId)
    .eq("user_id", user.id)
  if (error) return { ok: false }

  revalidatePath(`/channels/${input.slug}`)
  return { ok: true }
}
