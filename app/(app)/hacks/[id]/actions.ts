"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

function revalidateHack(hackId: string) {
  revalidatePath(`/hacks/${hackId}`)
  revalidatePath("/for-you")
  revalidatePath("/explore")
  revalidatePath("/saved")
  revalidatePath("/", "layout")
}

export async function toggleHackLike(
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

  revalidateHack(hackId)
  return { ok: true, liked: Boolean(data) }
}

export async function toggleHackSave(
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

  revalidateHack(hackId)
  return { ok: true, saved: Boolean(data) }
}

export async function addComment(input: {
  hackId: string
  bodyMd: string
  isTip?: boolean
  parentCommentId?: string | null
}): Promise<{ ok: boolean; commentId?: string; reason?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: "unauthenticated" }

  const { data, error } = await supabase.rpc("add_hack_comment", {
    p_hack_id: input.hackId,
    p_body_md: input.bodyMd,
    p_is_tip: input.isTip ?? false,
    p_parent_comment_id: input.parentCommentId ?? null,
  })

  if (error) return { ok: false, reason: error.message }

  revalidateHack(input.hackId)
  return { ok: true, commentId: data as string }
}

export async function deleteComment(
  commentId: string,
  hackId: string
): Promise<{ ok: boolean; reason?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: "unauthenticated" }

  const { error } = await supabase.rpc("delete_hack_comment", {
    p_comment_id: commentId,
  })

  if (error) return { ok: false, reason: error.message }

  revalidateHack(hackId)
  return { ok: true }
}

export async function toggleCommentLike(
  commentId: string,
  hackId: string
): Promise<{ ok: boolean; liked?: boolean; reason?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: "unauthenticated" }

  const { data, error } = await supabase.rpc("toggle_comment_like", {
    p_comment_id: commentId,
  })

  if (error) return { ok: false, reason: error.message }

  revalidateHack(hackId)
  return { ok: true, liked: Boolean(data) }
}
