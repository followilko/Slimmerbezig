"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

export type ReactionKind = "helpful" | "not_helpful"

/**
 * Mutually-exclusive thumbs reaction. Passing `null` clears both. Idempotent.
 * Writes to public.hack_interactions; RLS enforces user_id = auth.uid().
 */
export async function setReaction(
  hackId: string,
  reaction: ReactionKind | null
): Promise<{ ok: boolean; reason?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: "unauthenticated" }

  const { error: delErr } = await supabase
    .from("hack_interactions")
    .delete()
    .eq("user_id", user.id)
    .eq("hack_id", hackId)
    .in("kind", ["helpful", "not_helpful"])
  if (delErr) return { ok: false, reason: delErr.message }

  if (reaction) {
    const { error: insErr } = await supabase
      .from("hack_interactions")
      .insert({ user_id: user.id, hack_id: hackId, kind: reaction })
    if (insErr) return { ok: false, reason: insErr.message }
  }

  revalidatePath("/for-you")
  return { ok: true }
}

/**
 * Best-effort "user has actually seen this hack" signal. Called by
 * <HackViewTracker /> after a card has been ≥50% in the viewport for ~2s.
 *
 * - Idempotent: first call inserts, subsequent calls no-op via PK conflict.
 * - Silent: no revalidate (we never want the viewed signal to redraw the feed
 *   the user is actively reading).
 * - Tolerant: returns ok:true even when the DB rejects a duplicate.
 */
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

/**
 * Toggle the `saved` interaction on/off for a hack. Idempotent.
 */
export async function toggleSave(
  hackId: string
): Promise<{ ok: boolean; saved?: boolean; reason?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: "unauthenticated" }

  const { data: existing } = await supabase
    .from("hack_interactions")
    .select("hack_id")
    .eq("user_id", user.id)
    .eq("hack_id", hackId)
    .eq("kind", "saved")
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from("hack_interactions")
      .delete()
      .eq("user_id", user.id)
      .eq("hack_id", hackId)
      .eq("kind", "saved")
    if (error) return { ok: false, reason: error.message }
    revalidatePath("/for-you")
    return { ok: true, saved: false }
  }

  const { error } = await supabase
    .from("hack_interactions")
    .insert({ user_id: user.id, hack_id: hackId, kind: "saved" })
  if (error) return { ok: false, reason: error.message }
  revalidatePath("/for-you")
  return { ok: true, saved: true }
}
