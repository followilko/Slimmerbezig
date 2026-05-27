import type { SupabaseClient } from "@supabase/supabase-js"

import type { TagRow } from "./types"

/** Tags the model may reference by slug. */
export async function loadChatVocabulary(supabase: SupabaseClient): Promise<{
  sector: TagRow[]
  tool: TagRow[]
  capability: TagRow[]
  frustration: TagRow[]
  topic: TagRow[]
}> {
  const kinds = ["sector", "tool", "capability", "frustration", "topic"] as const

  const { data, error } = await supabase
    .from("tags")
    .select("id, slug, label, kind")
    .in("kind", kinds)

  if (error) {
    console.warn("[loadChatVocabulary] tags query failed", error.message)
    return { sector: [], tool: [], capability: [], frustration: [], topic: [] }
  }

  const rows = (data ?? []) as TagRow[]
  return {
    sector: rows.filter((r) => r.kind === "sector"),
    tool: rows.filter((r) => r.kind === "tool"),
    capability: rows.filter((r) => r.kind === "capability"),
    frustration: rows.filter((r) => r.kind === "frustration"),
    topic: rows.filter((r) => r.kind === "topic"),
  }
}
