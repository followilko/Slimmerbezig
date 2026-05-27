"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import type { UIMessage } from "ai"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function collectToolOutputs(messages: UIMessage[]) {
  const rows: { tool: string; output: unknown }[] = []
  for (const msg of messages) {
    if (msg.role !== "assistant") continue
    for (const part of msg.parts) {
      if (!part.type.startsWith("tool-")) continue
      const p = part as {
        type: string
        state?: string
        output?: unknown
      }
      if (p.state === "output-available") {
        rows.push({
          tool: p.type.replace(/^tool-/, ""),
          output: p.output,
        })
      }
    }
  }
  return rows
}

export type ToolOutputRenderer = (output: unknown) => ReactNode

type CoachChatProps = {
  /** e.g. `/api/onboarding/chat` or `/api/onboarding/chat?kind=checkin` */
  apiPath: string
  title: string
  description?: string
  /**
   * Optional pre-seeded assistant greeting shown before the first user turn.
   * Server-rendered in {@link app/onboarding/page.tsx} so returning users land
   * on continuity, not silence.
   */
  initialAssistantText?: string
  /**
   * Fires once on mount as the first user message — used by the Ask overlay
   * to forward whatever the user typed in the AskBar.
   */
  autoSendUserText?: string
  /**
   * If set, pushes the router to this path once the finish tool
   * (`finish_onboarding` / `finish_checkin`) returns `{ ok: true }`.
   */
  redirectOnFinishTo?: string
  /**
   * Map of tool name → custom inline renderer. When a renderer is provided,
   * the chat replaces the default "Structured update: tool_name…" placeholder
   * with the renderer output (only after the tool returns `output-available`).
   */
  toolRenderers?: Record<string, ToolOutputRenderer>
  /** Hide the right-hand "what we've captured" debug panel. */
  hideSidebar?: boolean
  /** Compact layout — no Card wrapper around the chat area. */
  compact?: boolean
}

const FINISH_TOOL_NAMES = new Set(["finish_onboarding", "finish_checkin"])

export function CoachChat({
  apiPath,
  title,
  description,
  initialAssistantText,
  autoSendUserText,
  redirectOnFinishTo,
  toolRenderers,
  hideSidebar,
  compact,
}: CoachChatProps) {
  const router = useRouter()
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: apiPath,
      }),
    [apiPath]
  )

  const initialMessages = useMemo<UIMessage[]>(() => {
    if (!initialAssistantText?.trim()) return []
    return [
      {
        id: "seed-assistant-greeting",
        role: "assistant",
        parts: [{ type: "text", text: initialAssistantText.trim() }],
      },
    ]
  }, [initialAssistantText])

  const { messages, sendMessage, status, stop, error } = useChat({
    transport,
    messages: initialMessages,
  })

  const [input, setInput] = useState("")

  const toolRows = useMemo(() => collectToolOutputs(messages), [messages])
  const busy = status === "submitted" || status === "streaming"

  const finishHandledRef = useRef(false)
  useEffect(() => {
    if (!redirectOnFinishTo || finishHandledRef.current) return
    const finished = toolRows.find((r) => {
      if (!FINISH_TOOL_NAMES.has(r.tool)) return false
      const out = r.output as { ok?: boolean } | null
      return Boolean(out?.ok)
    })
    if (!finished) return
    finishHandledRef.current = true
    const t = setTimeout(() => router.push(redirectOnFinishTo), 1200)
    return () => clearTimeout(t)
  }, [toolRows, redirectOnFinishTo, router])

  // Fire `autoSendUserText` exactly once on mount (Ask overlay → user's
  // pre-typed question becomes the first user message).
  const autoSentRef = useRef(false)
  useEffect(() => {
    if (autoSentRef.current) return
    const text = autoSendUserText?.trim()
    if (!text) return
    autoSentRef.current = true
    void sendMessage({ text })
  }, [autoSendUserText, sendMessage])

  const chatBody = (
    <div className="flex flex-col gap-4">
      <div
        className={`max-h-[28rem] overflow-y-auto rounded-xl text-sm ${
          compact ? "p-2" : "bg-muted p-4"
        }`}
      >
        {messages.length === 0 ? (
          <p className="text-muted-foreground">
            Messages will appear here. Say hi to get started.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((m) => (
              <li
                key={m.id}
                className={
                  m.role === "user"
                    ? "self-end rounded-lg bg-primary px-3 py-2 text-primary-foreground"
                    : "self-start rounded-lg border bg-card px-3 py-2 text-left"
                }
              >
                <div className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                  {m.role}
                </div>
                <div className="whitespace-pre-wrap">
                  {m.parts.map((part, idx) => {
                    if (part.type === "text") {
                      return (
                        <span key={`${m.id}-${idx}-text`}>{part.text}</span>
                      )
                    }
                    if (part.type.startsWith("tool-")) {
                      const toolName = part.type.replace(/^tool-/, "")
                      const tp = part as { state?: string; output?: unknown }
                      const ready = tp.state === "output-available"
                      const renderer = toolRenderers?.[toolName]
                      if (ready && renderer) {
                        return (
                          <div key={`${m.id}-${idx}-tool`}>
                            {renderer(tp.output)}
                          </div>
                        )
                      }
                      return (
                        <div
                          key={`${m.id}-${idx}-tool`}
                          className="text-muted-foreground mt-1 text-xs italic"
                        >
                          {`Structured update: ${toolName}…`}
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error ? (
        <p className="text-destructive text-sm">{error.message}</p>
      ) : null}

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={async (e) => {
          e.preventDefault()
          const text = input.trim()
          if (!text || busy) return
          setInput("")
          await sendMessage({ text })
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your reply…"
          disabled={busy}
          className="flex-1"
        />
        {busy ? (
          <Button type="button" variant="secondary" onClick={() => stop()}>
            Stop
          </Button>
        ) : (
          <Button type="submit" disabled={busy}>
            Send
          </Button>
        )}
      </form>
    </div>
  )

  const chatCard = compact ? (
    <div className="flex-1">{chatBody}</div>
  ) : (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? (
          <CardDescription>{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>{chatBody}</CardContent>
    </Card>
  )

  if (hideSidebar) {
    return compact ? (
      chatCard
    ) : (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">{chatCard}</div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 lg:flex-row">
      {chatCard}

      <Card className="w-full shrink-0 lg:w-96">
        <CardHeader>
          <CardTitle>What we&apos;ve captured</CardTitle>
          <CardDescription>
            Live tool outputs (sector, frustrations, interests, summary).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {toolRows.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No structured signals yet — keep chatting so the assistant can fill
              this in.
            </p>
          ) : (
            <ul className="flex flex-col gap-3 text-xs">
              {toolRows.map((row, idx) => (
                <li
                  key={`${row.tool}-${idx}`}
                  className="bg-muted rounded-md p-3 font-mono break-words"
                >
                  <div className="text-foreground mb-1 font-semibold">
                    {row.tool}
                  </div>
                  <pre className="text-muted-foreground max-h-40 overflow-auto text-[11px] whitespace-pre-wrap">
                    {JSON.stringify(row.output, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
