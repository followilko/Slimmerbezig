"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

export type ReactionKind = "helpful" | "not_helpful"

/**
 * Toggle Like on a hack via SECURITY DEFINER RPC.
 * Uses hack_interactions(kind='helpful') under the hood.
 */
export async function toggleLike(
  hackId: string
): Promise<{ ok: boolean; liked?: boolean; reason?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: "unauthenticated" }

  const { data, error } = await supabase.rpc("toggle_hack_like", {
    p_hack_id: hackId,
  })

  if (error) return { ok: false, reason: error.message }

  revalidatePath("/for-you")
  revalidatePath("/explore")
  revalidatePath(`/hacks/${hackId}`)
  return { ok: true, liked: Boolean(data) }
}

/** @deprecated Use toggleLike — kept for legacy HackCardActions surface. */
export async function setReaction(
  hackId: string,
  reaction: "helpful" | "not_helpful" | null
): Promise<{ ok: boolean; reason?: string }> {
  if (reaction === "not_helpful" || reaction === null) {
    return { ok: true }
  }
  const result = await toggleLike(hackId)
  return { ok: result.ok, reason: result.reason }
}

export async function recordView(
  hackId: string
): Promise<{ ok: boolean; reason?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: "unauthenticated" }

  const { error } = await supabase
    .from("hack_interactions")
    .insert({ user_id: user.id, hack_id: hackId, kind: "viewed" })

  if (error) {
    if (error.code === "23505") return { ok: true }
    return { ok: false, reason: error.message }
  }
  return { ok: true }
}

export async function toggleSave(
  hackId: string
): Promise<{ ok: boolean; saved?: boolean; reason?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: "unauthenticated" }

  const { data, error } = await supabase.rpc("toggle_hack_save", {
    p_hack_id: hackId,
  })

  if (error) return { ok: false, reason: error.message }

  revalidatePath("/for-you")
  revalidatePath("/explore")
  revalidatePath("/saved")
  revalidatePath(`/hacks/${hackId}`)
  revalidatePath("/", "layout")
  return { ok: true, saved: Boolean(data) }
}
