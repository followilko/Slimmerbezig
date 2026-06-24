import { lookup } from "node:dns/promises"

import { MAX_CONVERSATION_CHARS } from "@/lib/ai/hack-draft"

const FETCH_TIMEOUT_MS = 8_000
const MAX_REDIRECTS = 3

function isPrivateIp(addr: string): boolean {
  if (addr.includes(":")) {
    const a = addr.toLowerCase()
    return (
      a === "::1" ||
      a.startsWith("fc") ||
      a.startsWith("fd") ||
      a.startsWith("fe80") ||
      a === "::"
    )
  }
  const parts = addr.split(".").map((p) => parseInt(p, 10))
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true
  const [a, b] = parts
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  )
}

async function assertSafeUrl(raw: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error("invalid_url")
  }
  if (url.protocol !== "https:") throw new Error("url_must_be_https")
  const host = url.hostname.toLowerCase()
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new Error("url_host_blocked")
  }
  const { address } = await lookup(host)
  if (isPrivateIp(address)) throw new Error("url_host_blocked")
  return url
}

const AI_CHAT_SHARE_HOSTS = [
  "chatgpt.com",
  "chat.openai.com",
  "claude.ai",
  "gemini.google.com",
  "bard.google.com",
  "copilot.microsoft.com",
  "poe.com",
  "perplexity.ai",
] as const

function isAiChatShareHost(host: string): boolean {
  return AI_CHAT_SHARE_HOSTS.some(
    (h) => host === h || host.endsWith(`.${h}`)
  )
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
}

/** Fetch a public URL with SSRF guards, manual redirect re-validation, timeout and size cap. */
export async function extractReadableText(raw: string): Promise<string> {
  let target = await assertSafeUrl(raw)

  if (isAiChatShareHost(target.hostname.toLowerCase())) {
    throw new Error("ai_share_link")
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    let res: Response
    try {
      res = await fetch(target, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "user-agent": "SlimmerbezigBot/1.0 (+hack-import)" },
      })
    } finally {
      clearTimeout(timer)
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location")
      if (!location) throw new Error("redirect_without_location")
      target = await assertSafeUrl(new URL(location, target).toString())
      continue
    }

    if (res.status === 401 || res.status === 403 || res.status === 429) {
      throw new Error("blocked_by_site")
    }
    if (!res.ok) throw new Error("fetch_failed")

    const body = await res.text()
    const text = htmlToText(body).slice(0, MAX_CONVERSATION_CHARS)
    if (text.length < 20) throw new Error("no_readable_content")
    return text
  }

  throw new Error("too_many_redirects")
}
