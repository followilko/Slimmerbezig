import type { SupabaseClient } from "@supabase/supabase-js"
import { tool, zodSchema } from "ai"
import { z } from "zod"

import { envServer } from "@/lib/env.server"

import type { ChatKind } from "./types"
import { SECTOR_SLUGS } from "./types"
import { currentWeekStartUtc } from "./week"
import { validateLinkedinUrl } from "./linkedin"

export type ToolsContext = {
  supabase: SupabaseClient
  userId: string
  sessionId: string | null
  kind: ChatKind
}

const tagSuggestionKindSchema = z.enum([
  "sector",
  "topic",
  "skill",
  "tool",
  "frustration",
  "capability",
])

async function fetchTagsBySlug(
  supabase: SupabaseClient,
  slugs: string[]
): Promise<Map<string, { id: string; kind: string }>> {
  const map = new Map<string, { id: string; kind: string }>()
  if (!slugs.length) return map
  const { data, error } = await supabase
    .from("tags")
    .select("id, slug, kind")
    .in("slug", slugs)
  if (error) throw new Error(error.message)
  for (const row of data ?? []) {
    map.set(row.slug as string, {
      id: row.id as string,
      kind: row.kind as string,
    })
  }
  return map
}

function sharedTools(ctx: ToolsContext) {
  const stub = envServer.AI_CHAT_STUB_TOOLS

  return {
    set_sector: tool({
      description:
        "Call when the user has clearly named their primary work field. Records sectorSlug on profiles.sector. Must be one of VOCAB_JSON.sector.",
      inputSchema: zodSchema(
        z.object({
          sectorSlug: z.string().refine(
            (v): v is (typeof SECTOR_SLUGS)[number] =>
              (SECTOR_SLUGS as readonly string[]).includes(v),
            { message: "unknown_sector_slug" }
          ),
        })
      ),
      execute: async ({ sectorSlug }) => {
        if (stub) {
          console.log("[AI stub] set_sector", sectorSlug)
          return { stub: true, sectorSlug }
        }
        const { error } = await ctx.supabase
          .from("profiles")
          .update({ sector: sectorSlug })
          .eq("id", ctx.userId)
        if (error) throw new Error(error.message)
        return { ok: true as const, sectorSlug }
      },
    }),

    record_linkedin: tool({
      description:
        "Call when the user shares a LinkedIn profile URL (and optionally pastes their headline / about text). Validates URL shape, normalizes it, writes profiles.linkedin_url and (if provided) profiles.headline. Returns the parsed vanity slug for echo-back confirmation. Do NOT invent the URL — only call when the user actually shared one.",
      inputSchema: zodSchema(
        z.object({
          url: z.string().min(4).max(400),
          headlineText: z.string().max(280).optional(),
          aboutText: z.string().max(2000).optional(),
        })
      ),
      execute: async ({ url, headlineText }) => {
        const parsed = validateLinkedinUrl(url)
        if (!parsed.ok) {
          return { ok: false as const, reason: parsed.reason }
        }
        if (stub) {
          console.log("[AI stub] record_linkedin", parsed.normalized, headlineText)
          return { stub: true, ...parsed }
        }
        const patch: Record<string, unknown> = { linkedin_url: parsed.normalized }
        if (headlineText && headlineText.trim()) {
          patch.headline = headlineText.trim()
        }
        const { error } = await ctx.supabase
          .from("profiles")
          .update(patch)
          .eq("id", ctx.userId)
        if (error) throw new Error(error.message)
        return {
          ok: true as const,
          normalized: parsed.normalized,
          vanity: parsed.vanity,
          storedHeadline: Boolean(patch.headline),
        }
      },
    }),

    add_frustration: tool({
      description:
        "Call when the user describes a workplace task / pain that they'd like to solve or speed up. Inserts a user_frustrations row + optional tag links. Body is the user's own words trimmed to ≤200 chars where possible. Ignore tagSlugs that aren't in VOCAB_JSON; use propose_tag for missing concepts.",
      inputSchema: zodSchema(
        z.object({
          body: z.string().min(1).max(2000),
          tagSlugs: z.array(z.string()).max(16).optional().default([]),
        })
      ),
      execute: async ({ body, tagSlugs }) => {
        if (stub) {
          console.log("[AI stub] add_frustration", body, tagSlugs)
          return { stub: true, body, tagSlugs }
        }
        const { data: frustration, error: insErr } = await ctx.supabase
          .from("user_frustrations")
          .insert({ user_id: ctx.userId, body })
          .select("id")
          .single()
        if (insErr) throw new Error(insErr.message)
        const fId = frustration!.id as string

        const map = await fetchTagsBySlug(ctx.supabase, tagSlugs)
        const junction = tagSlugs
          .map((slug) =>
            map.has(slug)
              ? { frustration_id: fId, tag_id: map.get(slug)!.id }
              : null
          )
          .filter(Boolean) as { frustration_id: string; tag_id: string }[]

        if (junction.length) {
          const { error: jErr } = await ctx.supabase
            .from("user_frustration_tags")
            .insert(junction)
          if (jErr) throw new Error(jErr.message)
        }

        const missing = tagSlugs.filter((s) => !map.has(s))
        return {
          ok: true as const,
          frustrationId: fId,
          linked: junction.length,
          missingSlugs: missing,
        }
      },
    }),

    add_interest: tool({
      description:
        "Call when the user names a tool or AI capability they use / want. Upserts user_interests for any slugs that exist in VOCAB_JSON.tool / VOCAB_JSON.capability. Unmatched slugs are reported back in `unmatched` — for those, call propose_tag ONCE and move on (do not retry add_interest with the same unknown slug).",
      inputSchema: zodSchema(
        z.object({
          tagSlugs: z.array(z.string()).max(24),
          weight: z.number().min(0).max(3).optional().default(1),
          sourceHint: z.string().max(200).optional(),
        })
      ),
      execute: async ({ tagSlugs, weight, sourceHint }) => {
        if (stub) {
          console.log("[AI stub] add_interest", tagSlugs, weight, sourceHint)
          return { stub: true, tagSlugs }
        }

        const map = await fetchTagsBySlug(ctx.supabase, tagSlugs)
        const matched: string[] = []
        const unmatched: string[] = []
        const rows: Record<string, unknown>[] = []
        for (const slug of tagSlugs) {
          const t = map.get(slug)
          if (!t || (t.kind !== "tool" && t.kind !== "capability")) {
            unmatched.push(slug)
            continue
          }
          matched.push(slug)
          rows.push({
            user_id: ctx.userId,
            tag_id: t.id,
            weight,
            source: sourceHint ?? "ai_chat",
          })
        }

        if (rows.length) {
          const { error } = await ctx.supabase
            .from("user_interests")
            .upsert(rows, { onConflict: "user_id,tag_id" })
          if (error) throw new Error(error.message)
        }

        return {
          ok: true as const,
          upserts: rows.length,
          matched,
          unmatched,
          hint:
            unmatched.length > 0
              ? "Unmatched slugs are new vocabulary — call propose_tag for each you want curated, then move on. Do NOT call add_interest again with these slugs."
              : undefined,
        }
      },
    }),

    update_understanding: tool({
      description:
        "Call after each meaningful turn to refresh the rolling summary on profile_understanding. Summary ≤6 sentences, factual, no marketing fluff. Optional signals JSON (keys: sector_estimate, frustrations, tools, ai_capabilities, role_hint).",
      inputSchema: zodSchema(
        z.object({
          summary: z.string().min(1).max(4000),
          signals: z.record(z.string(), z.unknown()).optional(),
        })
      ),
      execute: async ({ summary, signals }) => {
        if (stub) {
          console.log("[AI stub] update_understanding", summary, signals)
          return { stub: true, summary }
        }
        const { error } = await ctx.supabase.from("profile_understanding").upsert(
          {
            user_id: ctx.userId,
            summary,
            signals: signals ?? {},
          },
          { onConflict: "user_id" }
        )
        if (error) throw new Error(error.message)
        return { ok: true as const }
      },
    }),

    propose_tag: tool({
      description:
        "Call when the user mentions a tool / capability / topic that isn't in VOCAB_JSON. Normalizes slug to lower_snake_case and queues a tag_suggestions row for curator review.",
      inputSchema: zodSchema(
        z.object({
          slugGuess: z.string().min(2).max(80),
          labelGuess: z.string().min(2).max(120),
          kind: tagSuggestionKindSchema,
          reason: z.string().max(600).optional(),
        })
      ),
      execute: async ({ slugGuess, labelGuess, kind, reason }) => {
        const normalized = slugGuess
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "")
        if (normalized.length < 2)
          throw new Error("normalized_slug_empty_or_too_short")
        if (stub) {
          console.log("[AI stub] propose_tag", normalized, labelGuess, kind)
          return { stub: true, normalized, labelGuess, kind }
        }
        const { error } = await ctx.supabase.from("tag_suggestions").insert({
          slug_guess: normalized,
          label_guess: labelGuess,
          kind,
          proposed_by: ctx.userId,
          source_session_id: ctx.sessionId,
          status: "pending",
          notes: reason ?? null,
        })
        if (error) throw new Error(error.message)
        return { ok: true as const, normalized }
      },
    }),
  }
}

function onboardingExclusive(ctx: ToolsContext) {
  const stub = envServer.AI_CHAT_STUB_TOOLS
  return {
    finish_onboarding: tool({
      description:
        "Call to wrap up the conversation. ALWAYS succeeds — your judgement is the gate, not a server-side check. Marks profiles.onboarded_at and closes the chat session. The client auto-redirects the user to /for-you next.",
      inputSchema: zodSchema(
        z.object({ acknowledged: z.boolean().optional() })
      ),
      execute: async () => {
        if (stub) {
          console.log("[AI stub] finish_onboarding")
          return { stub: true }
        }

        const sessionId = ctx.sessionId

        const { error: profErr } = await ctx.supabase
          .from("profiles")
          .update({ onboarded_at: new Date().toISOString() })
          .eq("id", ctx.userId)
        if (profErr) {
          console.warn("[finish_onboarding] profile update:", profErr.message)
        }

        if (sessionId) {
          const { error: sesErr } = await ctx.supabase
            .from("chat_sessions")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("id", sessionId)
            .eq("user_id", ctx.userId)
          if (sesErr) console.warn("[finish_onboarding] session:", sesErr.message)
        }

        return { ok: true as const }
      },
    }),
  }
}

function askExclusive(ctx: ToolsContext) {
  const stub = envServer.AI_CHAT_STUB_TOOLS
  return {
    find_hacks: tool({
      description:
        "Call when the user asks how-to questions, looks for inspiration, or otherwise wants concrete hacks from the platform. Runs public.find_hacks (tag-overlap + FTS + OR fallback). Pass concrete nouns only — drop filler words like tips/tricks/hacks/help. Include VOCAB tool/sector slugs verbatim when the user names them. Returns up to `limit` published hacks with id/title/summary/source; use hacks.length >= 8 as the signal to ask a narrowing question. The UI renders clickable cards (capped at 5 visible) — narrate briefly rather than dump titles.",
      inputSchema: zodSchema(
        z.object({
          query: z.string().min(1).max(500),
          limit: z.number().int().min(1).max(10).optional().default(10),
        })
      ),
      execute: async ({ query, limit }) => {
        if (stub) {
          console.log("[AI stub] find_hacks", query, limit)
          return { stub: true, query, limit, hacks: [] }
        }
        const { data, error } = await ctx.supabase.rpc("find_hacks", {
          p_query: query,
          p_limit: limit,
        })
        if (error) {
          return { ok: false as const, reason: error.message, query }
        }
        const hacks = ((data ?? []) as Array<Record<string, unknown>>).map(
          (h) => ({
            id: h.id as string,
            title: h.title as string,
            summary: (h.summary as string | null) ?? null,
            source: h.source as string,
          })
        )
        return {
          ok: true as const,
          query,
          count: hacks.length,
          hacks,
        }
      },
    }),

    suggest_challenge: tool({
      description:
        "Call when find_hacks returned zero results (including after one broadened retry) or the user wants help but no platform hack exists. Does NOT insert a challenge — returns a deep-link to /challenges/new so the user can review and submit the form themselves. Never suggest Twitter, Google, or other off-platform search.",
      inputSchema: zodSchema(
        z.object({
          suggestedTitle: z.string().min(3).max(120),
          suggestedBody: z.string().max(2000).optional(),
          tagSlugs: z.array(z.string()).max(8).optional().default([]),
        })
      ),
      execute: async ({ suggestedTitle, suggestedBody, tagSlugs }) => {
        const params = new URLSearchParams()
        params.set("title", suggestedTitle.trim())
        if (suggestedBody?.trim()) {
          params.set("body", suggestedBody.trim())
        }
        if (tagSlugs.length) {
          params.set("tag", tagSlugs.join(","))
        }
        const href = `/challenges/new?${params.toString()}`

        if (stub) {
          console.log("[AI stub] suggest_challenge", suggestedTitle, href)
          return {
            stub: true,
            suggestedTitle,
            suggestedBody: suggestedBody ?? null,
            tagSlugs,
            href,
          }
        }

        return {
          ok: true as const,
          suggestedTitle: suggestedTitle.trim(),
          suggestedBody: suggestedBody?.trim() ?? null,
          tagSlugs,
          href,
        }
      },
    }),
  }
}

function checkinExclusive(ctx: ToolsContext) {
  const stub = envServer.AI_CHAT_STUB_TOOLS
  return {
    save_weekly_checkin: tool({
      description:
        "Call once per check-in conversation when the user has shared their weekly recap. Upserts weekly_checkins for the current UTC week bucket and replaces tag links. Body should be the user's recap text, ≤4000 chars.",
      inputSchema: zodSchema(
        z.object({
          body: z.string().min(1).max(4000),
          tagSlugs: z.array(z.string()).max(32).optional().default([]),
        })
      ),
      execute: async ({ body, tagSlugs }) => {
        const week_start = currentWeekStartUtc()
        if (stub) {
          console.log(
            "[AI stub] save_weekly_checkin",
            week_start,
            body,
            tagSlugs
          )
          return { stub: true, week_start }
        }

        const { data: checkinRow, error: upErr } = await ctx.supabase
          .from("weekly_checkins")
          .upsert(
            { user_id: ctx.userId, week_start, body },
            { onConflict: "user_id,week_start" }
          )
          .select("id")
          .single()

        if (upErr) throw new Error(upErr.message)
        const checkinId = checkinRow!.id as string

        await ctx.supabase
          .from("weekly_checkin_tags")
          .delete()
          .eq("checkin_id", checkinId)

        const map = await fetchTagsBySlug(ctx.supabase, tagSlugs)
        const junction = tagSlugs
          .filter((slug) => map.has(slug))
          .map((slug) => ({
            checkin_id: checkinId,
            tag_id: map.get(slug)!.id,
          }))

        if (junction.length) {
          const { error: tagErr } = await ctx.supabase
            .from("weekly_checkin_tags")
            .insert(junction)
          if (tagErr) throw new Error(tagErr.message)
        }

        return { ok: true as const, week_start, tagLinks: junction.length }
      },
    }),

    finish_checkin: tool({
      description:
        "Call to wrap up the check-in conversation. ALWAYS succeeds — your judgement is the gate. Closes the chat session.",
      inputSchema: zodSchema(
        z.object({ acknowledged: z.boolean().optional() })
      ),
      execute: async () => {
        if (stub) {
          console.log("[AI stub] finish_checkin")
          return { stub: true }
        }

        const sessionId = ctx.sessionId
        if (!sessionId) return { ok: false as const, reason: "no_session_id" }

        const { error } = await ctx.supabase
          .from("chat_sessions")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", sessionId)
          .eq("user_id", ctx.userId)
        if (error) throw new Error(error.message)
        return { ok: true as const }
      },
    }),
  }
}

export function createChatTools(ctx: ToolsContext) {
  const base = sharedTools(ctx)
  if (ctx.kind === "onboarding") {
    return { ...base, ...onboardingExclusive(ctx) }
  }
  if (ctx.kind === "ask") {
    return { ...base, ...askExclusive(ctx) }
  }
  return { ...base, ...checkinExclusive(ctx) }
}
