import type { SupabaseClient } from "@supabase/supabase-js"
import { tool, zodSchema } from "ai"
import { z } from "zod"

import { envServer } from "@/lib/env.server"

import type { ChatKind } from "./types"
import { SECTOR_SLUGS } from "./types"
import { currentWeekStartUtc } from "./week"

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
        "Record the learner's primary sector slug (exactly matching VOCAB_JSON.sector).",
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

    add_frustration: tool({
      description:
        "Persist a concise frustration narrative plus curated tag slugs (frustration/topic/tool/capability/sector refs from VOCAB_JSON). Ignore unknown slugs.",
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
            map.has(slug) ? { frustration_id: fId, tag_id: map.get(slug)!.id } : null
          )
          .filter(Boolean) as { frustration_id: string; tag_id: string }[]

        if (junction.length) {
          const { error: jErr } = await ctx.supabase
            .from("user_frustration_tags")
            .insert(junction)
          if (jErr) throw new Error(jErr.message)
        }

        const missing = tagSlugs.filter((s) => !map.has(s))
        return { ok: true as const, frustrationId: fId, linked: junction.length, missingSlugs: missing }
      },
    }),

    add_interest: tool({
      description:
        "Weight tool or capability tag intersections for recommendations. Tag slugs must exist in VOCAB_JSON.tool / VOCAB_JSON.capability.",
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
        const rows = tagSlugs
          .map((slug) => {
            const t = map.get(slug)
            if (!t) return null
            if (t.kind !== "tool" && t.kind !== "capability") return null
            return {
              user_id: ctx.userId,
              tag_id: t.id,
              weight,
              source: sourceHint ?? "ai_chat",
            }
          })
          .filter(Boolean) as Record<string, unknown>[]

        if (!rows.length) {
          return { ok: false as const, reason: "no_valid_tool_capability_slugs" }
        }

        const { error } = await ctx.supabase.from("user_interests").upsert(rows, {
          onConflict: "user_id,tag_id",
        })
        if (error) throw new Error(error.message)
        return { ok: true as const, upserts: rows.length }
      },
    }),

    update_understanding: tool({
      description:
        'Rolling factual summary stored server-side — keep ≤6 sentences plus optional JSON signals (e.g. {"tools":["notion"],"frustrations":["meetings overload"]}).',
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
        "Queue curator review for a slug not listed in VOCAB_JSON. Normalize slug snake_case lowercase.",
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
        return { ok: true as const }
      },
    }),
  }
}

function onboardingExclusive(ctx: ToolsContext) {
  const stub = envServer.AI_CHAT_STUB_TOOLS
  return {
    finish_onboarding: tool({
      description:
        "Call once sector, frustrations (1–3), mixed interests tags, and summary are confidently captured.",
      inputSchema: zodSchema(z.object({ acknowledged: z.boolean().optional() })),
      execute: async () => {
        if (stub) {
          console.log("[AI stub] finish_onboarding")
          return { stub: true }
        }

        const sessionId = ctx.sessionId

        const { error: profErr } = await ctx.supabase
          .from("profiles")
          .update({
            onboarded_at: new Date().toISOString(),
          })
          .eq("id", ctx.userId)
        // onboarded_at column optional before migration — ignore if fails
        if (profErr) console.warn("[finish_onboarding] profile update:", profErr.message)

        if (sessionId) {
          const { error: sesErr } = await ctx.supabase
            .from("chat_sessions")
            .update({ status: "completed", completed_at: new Date().toISOString() })
            .eq("id", sessionId)
            .eq("user_id", ctx.userId)
          if (sesErr) console.warn("[finish_onboarding] session:", sesErr.message)
        }

        return { ok: true as const }
      },
    }),
  }
}

function checkinExclusive(ctx: ToolsContext) {
  const stub = envServer.AI_CHAT_STUB_TOOLS
  return {
    save_weekly_checkin: tool({
      description:
        "Upsert weekly check-in body for the current UTC week bucket plus curated tag overlaps.",
      inputSchema: zodSchema(
        z.object({
          body: z.string().min(1).max(4000),
          tagSlugs: z.array(z.string()).max(32).optional().default([]),
        })
      ),
      execute: async ({ body, tagSlugs }) => {
        const week_start = currentWeekStartUtc()
        if (stub) {
          console.log("[AI stub] save_weekly_checkin", week_start, body, tagSlugs)
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
      description: "Marks the guided check-in session complete.",
      inputSchema: zodSchema(z.object({ acknowledged: z.boolean().optional() })),
      execute: async () => {
        if (stub) {
          console.log("[AI stub] finish_checkin")
          return { stub: true }
        }
        const sessionId = ctx.sessionId
        if (!sessionId) return { ok: false as const, reason: "no_session_id" }

        const { error } = await ctx.supabase
          .from("chat_sessions")
          .update({ status: "completed", completed_at: new Date().toISOString() })
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
  return { ...base, ...checkinExclusive(ctx) }
}
