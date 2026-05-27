import { openai } from "@ai-sdk/openai"
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai"

import { buildChatSystemPrompt } from "@/lib/ai/system-prompt"
import { createChatTools } from "@/lib/ai/tools"
import { loadChatVocabulary } from "@/lib/ai/load-vocabulary"
import { persistChatTurn } from "@/lib/ai/persist"
import { ensureOpenChatSession } from "@/lib/ai/session"
import { getCoverage } from "@/lib/ai/coverage"
import { getRecentFeedback } from "@/lib/ai/recent-feedback"
import { envServer } from "@/lib/env.server"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 60

// Hard cap on the rolling client transcript we let through to the model.
// 50 "turns" ≈ 100 messages (user + assistant). Above this we keep the
// latest 100 messages; the rolling profile_understanding.summary carries
// older context across.
const MAX_MESSAGES = 100

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

  const trimmedMessages =
    messages.length > MAX_MESSAGES ? messages.slice(-MAX_MESSAGES) : messages

  const [vocab, coverage, recentFeedback, understandingRes, profileRes] =
    await Promise.all([
      loadChatVocabulary(supabase),
      getCoverage(supabase, user.id),
      getRecentFeedback(supabase, user.id),
      supabase
        .from("profile_understanding")
        .select("summary")
        .eq("user_id", user.id)
        .maybeSingle<{ summary: string }>(),
      supabase
        .from("profiles")
        .select("given_name, full_name")
        .eq("id", user.id)
        .maybeSingle<{ given_name: string | null; full_name: string | null }>(),
    ])

  const understandingSummary: string | null =
    understandingRes.data?.summary ?? null
  const givenName: string | null =
    profileRes.data?.given_name ??
    profileRes.data?.full_name?.split(" ")[0]?.trim() ??
    null

  const sessionId = await ensureOpenChatSession(supabase, user.id, "ask")

  const system = buildChatSystemPrompt({
    kind: "ask",
    vocab,
    understandingSummary,
    givenName,
    coverage,
    recentFeedback,
  })

  const tools = createChatTools({
    supabase,
    userId: user.id,
    sessionId,
    kind: "ask",
  })

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system,
    messages: await convertToModelMessages(trimmedMessages),
    tools,
    stopWhen: stepCountIs(12),
    onFinish: async (event) => {
      await persistChatTurn({
        supabase,
        sessionId,
        requestMessages: trimmedMessages,
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
