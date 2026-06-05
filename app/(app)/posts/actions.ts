"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

/**
 * Toggle the `saved` interaction on/off for a post (hack). Idempotent.
 * Mirrors app/for-you/actions.ts `toggleSave` — kept as a thin alias under
 * the post-card surface so [components/post/post-favorite-button.tsx] can
 * import from a stable path. RLS on public.hack_interactions scopes by
 * auth.uid(); FK to public.hacks rejects stale/dummy ids.
 *
 * Revalidates: /explore, /for-you, /saved, and the root layout (header badge).
 * The detail page is path-revalidated by the dynamic route's own server data.
 */
export async function togglePostFavorite(
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

    revalidatePath("/explore")
    revalidatePath("/for-you")
    revalidatePath("/saved")
    revalidatePath("/", "layout")
    return { ok: true, saved: false }
  }

  const { error } = await supabase
    .from("hack_interactions")
    .insert({ user_id: user.id, hack_id: hackId, kind: "saved" })
  if (error) return { ok: false, reason: error.message }

  revalidatePath("/explore")
  revalidatePath("/for-you")
  revalidatePath("/saved")
  revalidatePath("/", "layout")
  return { ok: true, saved: true }
}
