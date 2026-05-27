"use server"

import { revalidatePath } from "next/cache"

import { POSTS } from "@/lib/dummy/posts"
import {
  getSavedPostIds,
  writeSavedPostIds,
} from "@/lib/posts/saved-posts-cookie"

/**
 * Toggle favorite for a dummy post id (cookie-backed until hacks schema supports
 * the full PostCard shape and real rows back the feed).
 */
export async function togglePostFavorite(
  postId: string
): Promise<{ ok: boolean; saved?: boolean; reason?: string }> {
  if (!POSTS.some((p) => p.id === postId)) {
    return { ok: false, reason: "invalid_post" }
  }

  const saved = await getSavedPostIds()
  const next = new Set(saved)
  let isSaved: boolean

  if (next.has(postId)) {
    next.delete(postId)
    isSaved = false
  } else {
    next.add(postId)
    isSaved = true
  }

  await writeSavedPostIds([...next])

  revalidatePath("/for-you")
  revalidatePath("/saved")
  revalidatePath(`/hacks/${postId}`)
  revalidatePath("/", "layout")

  return { ok: true, saved: isSaved }
}
