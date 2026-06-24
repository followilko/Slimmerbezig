import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"

import {
  buildHackGenerationPrompt,
  buildScreenshotUserContent,
  extractReadableText,
  HACK_GENERATION_SYSTEM_PROMPT,
  hackDraftSchema,
  MAX_CONVERSATION_CHARS,
  MAX_SCREENSHOTS,
  SCREENSHOT_INSTRUCTION,
  scrubDraft,
  validateScreenshotDataUrl,
} from "@/lib/ai/hack-generation"
import { envServer } from "@/lib/env.server"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 60

type GenerateBody = {
  sourceType?: "url" | "conversation" | "screenshot"
  url?: string
  conversation?: string
  images?: string[]
}

export async function POST(req: Request) {
  if (!envServer.OPENAI_API_KEY) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 503 }
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }

  // Capability gate — don't spend model calls for users who can't publish.
  const { data: allowed } = await supabase.rpc("user_can_create_hacks", {
    p_user: user.id,
  })
  if (!allowed) {
    return Response.json({ error: "not_allowed" }, { status: 403 })
  }

  let body: GenerateBody
  try {
    body = (await req.json()) as GenerateBody
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 })
  }

  const sourceType: "url" | "conversation" | "screenshot" =
    body.sourceType ??
    (body.url ? "url" : body.images?.length ? "screenshot" : "conversation")

  if (sourceType === "screenshot") {
    const images = body.images ?? []
    if (images.length < 1) {
      return Response.json({ error: "screenshot_required" }, { status: 400 })
    }
    if (images.length > MAX_SCREENSHOTS) {
      return Response.json({ error: "too_many_screenshots" }, { status: 400 })
    }
    if (!images.every(validateScreenshotDataUrl)) {
      return Response.json({ error: "screenshot_invalid" }, { status: 400 })
    }

    try {
      const { object } = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: hackDraftSchema,
        system: HACK_GENERATION_SYSTEM_PROMPT + SCREENSHOT_INSTRUCTION,
        messages: [
          {
            role: "user",
            content: buildScreenshotUserContent(images),
          },
        ],
      })

      return Response.json({ draft: scrubDraft(object) })
    } catch {
      return Response.json({ error: "generation_failed" }, { status: 502 })
    }
  }

  let text: string
  try {
    if (sourceType === "url") {
      if (!body.url?.trim()) {
        return Response.json({ error: "url_required" }, { status: 400 })
      }
      text = await extractReadableText(body.url.trim())
    } else {
      const convo = body.conversation?.trim() ?? ""
      if (convo.length < 20) {
        return Response.json({ error: "conversation_too_short" }, { status: 400 })
      }
      text = convo.slice(0, MAX_CONVERSATION_CHARS)
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : "input_error"
    return Response.json({ error: reason }, { status: 400 })
  }

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: hackDraftSchema,
      system: HACK_GENERATION_SYSTEM_PROMPT,
      prompt: buildHackGenerationPrompt({ sourceType, text }),
    })

    return Response.json({ draft: scrubDraft(object) })
  } catch {
    return Response.json({ error: "generation_failed" }, { status: 502 })
  }
}
