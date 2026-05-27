import { openai } from "@ai-sdk/openai"
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai"

import { buildChatSystemPrompt } from "@/lib/ai/system-prompt"
import { createChatTools } from "@/lib/ai/tools"
import type { ChatKind } from "@/lib/ai/types"
import { loadChatVocabulary } from "@/lib/ai/load-vocabulary"
import { persistChatTurn } from "@/lib/ai/persist"
import { ensureOpenChatSession } from "@/lib/ai/session"
import { envServer } from "@/lib/env.server"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 60

export async function POST(req: Request) {
  if (!envServer.OPENAI_API_KEY) {
    return new Response("OPENAI_API_KEY is not configured", { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const url = new URL(req.url)
  const kindParam = url.searchParams.get("kind")
  const kind: ChatKind =
    kindParam === "checkin" ? "checkin" : "onboarding"

  let body: { messages: UIMessage[] }
  try {
    body = (await req.json()) as { messages: UIMessage[] }
  } catch {
    return new Response("Invalid JSON body", { status: 400 })
  }

  const { messages } = body
  if (!Array.isArray(messages)) {
    return new Response("`messages` must be an array", { status: 400 })
  }

  const vocab = await loadChatVocabulary(supabase)

  let understandingSummary: string | null = null
  const { data: understandingRow } = await supabase
    .from("profile_understanding")
    .select("summary")
    .eq("user_id", user.id)
    .maybeSingle<{ summary: string }>()
  understandingSummary = understandingRow?.summary ?? null

  const sessionId = await ensureOpenChatSession(supabase, user.id, kind)

  const system = buildChatSystemPrompt({
    kind,
    vocab,
    understandingSummary,
  })

  const toolsCtx = {
    supabase,
    userId: user.id,
    sessionId,
    kind,
  }

  const tools = createChatTools(toolsCtx)

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(12),
    onFinish: async (event) => {
      await persistChatTurn({
        supabase,
        sessionId,
        requestMessages: messages,
        finish: {
          text: event.text,
          finishReason: event.finishReason,
          toolCalls: event.toolCalls as unknown[],
          toolResults: event.toolResults as unknown[],
        },
      })
    },
  })

  return result.toUIMessageStreamResponse()
}
