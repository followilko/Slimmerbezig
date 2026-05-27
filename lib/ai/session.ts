import type { SupabaseClient } from "@supabase/supabase-js"

import type { ChatKind } from "./types"

/**
 * Ensures one open chat session per (user, kind). Creates a row if missing.
 */
export async function ensureOpenChatSession(
  supabase: SupabaseClient,
  userId: string,
  kind: ChatKind
): Promise<string | null> {
  if (!userId) return null

  const { data: existing, error: selectError } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("kind", kind)
    .eq("status", "open")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (selectError) {
    console.warn("[ensureOpenChatSession] select:", selectError.message)
    return null
  }

  if (existing?.id) return existing.id

  const { data: inserted, error: insertError } = await supabase
    .from("chat_sessions")
    .insert({ user_id: userId, kind, status: "open" })
    .select("id")
    .single()

  if (insertError) {
    console.warn("[ensureOpenChatSession] insert:", insertError.message)
    return null
  }

  return inserted?.id ?? null
}
