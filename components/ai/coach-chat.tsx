"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import type { UIMessage } from "ai"
import { useMemo, useState } from "react"

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

type CoachChatProps = {
  /** e.g. `/api/onboarding/chat` or `/api/onboarding/chat?kind=checkin` */
  apiPath: string
  title: string
  description?: string
}

export function CoachChat({ apiPath, title, description }: CoachChatProps) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: apiPath,
      }),
    [apiPath]
  )

  const { messages, sendMessage, status, stop, error } = useChat({
    transport,
  })

  const [input, setInput] = useState("")

  const toolRows = useMemo(() => collectToolOutputs(messages), [messages])
  const busy = status === "submitted" || status === "streaming"

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 lg:flex-row">
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="bg-muted max-h-[28rem] overflow-y-auto rounded-xl p-4 text-sm">
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
                          return (
                            <div
                              key={`${m.id}-${idx}-tool`}
                              className="text-muted-foreground mt-1 text-xs italic"
                            >
                              {`Structured update: ${part.type.replace(/^tool-/, "")}…`}
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
        </CardContent>
      </Card>

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
