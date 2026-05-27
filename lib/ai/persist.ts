import type { SupabaseClient } from "@supabase/supabase-js"
import type { UIMessage } from "ai"

/** Minimal assistant-turn snapshot for transcripts. */
export async function persistChatTurn(opts: {
  supabase: SupabaseClient
  sessionId: string | null
  requestMessages: UIMessage[]
  finish: {
    text: string
    finishReason: string
    toolCalls: unknown[]
    toolResults: unknown[]
  }
}) {
  const { supabase, sessionId, requestMessages, finish } = opts
  if (!sessionId) return

  const lastUser = [...requestMessages].reverse().find((m) => m.role === "user")
  if (!lastUser) return

  const userPayload = {
    id: lastUser.id,
    role: lastUser.role,
    parts: lastUser.parts,
  }

  const assistantPayload = {
    text: finish.text,
    finishReason: finish.finishReason,
    toolCalls: finish.toolCalls,
    toolResults: finish.toolResults,
  }

  const { error } = await supabase.from("chat_messages").insert([
    { session_id: sessionId, role: "user", content: userPayload },
    {
      session_id: sessionId,
      role: "assistant",
      content: assistantPayload,
    },
  ])

  if (error) console.warn("[persistChatTurn]", error.message)
}
