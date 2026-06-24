"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

/**
 * Toggle Save on a post (hack) via SECURITY DEFINER RPC.
 */
export async function togglePostFavorite(
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

  revalidatePath("/explore")
  revalidatePath("/for-you")
  revalidatePath("/saved")
  revalidatePath(`/hacks/${hackId}`)
  revalidatePath("/", "layout")
  return { ok: true, saved: Boolean(data) }
}
