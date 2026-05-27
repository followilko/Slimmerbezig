import type { SupabaseClient } from "@supabase/supabase-js"

import type { ChatKind, SectorSlug } from "./types"
import { currentWeekStartUtc } from "./week"

/**
 * Snapshot of which structured onboarding/check-in signals the user has
 * captured so far. Used by the system prompt as STEERING hints only —
 * NOT as a hard gate (ADR 2026-05-27 — Soft coverage hints). The finish
 * tools always succeed; the coach decides when to wrap up based on the
 * conversation flow, not on row counts.
 */
export type Coverage = {
  sector: SectorSlug | null
  hasLinkedinUrl: boolean
  frustrationCount: number
  /** Tags of kind 'tool' or 'capability' linked in user_interests. */
  interestCount: number
  /** Pending tag_suggestions of kind tool/capability proposed by this user. */
  proposedToolCapabilityCount: number
  /** True if a weekly_checkins row exists for the current UTC week bucket. */
  weekCheckinExists: boolean
  onboardedAt: string | null
}

/**
 * Aspirational targets surfaced as "Aim for" hints in the system prompt.
 * The coach reads these to know what to gently steer towards, NOT what to
 * block on.
 */
export const COVERAGE_TARGETS = {
  onboarding: { frustrations: 1, interests: 2 },
  checkin: { frustrations: 0, interests: 0 },
  /** Ask doesn't have a "wrap-up" — coverage is never surfaced in its prompt. */
  ask: { frustrations: 0, interests: 0 },
} as const

export async function getCoverage(
  supabase: SupabaseClient,
  userId: string
): Promise<Coverage> {
  const [profileRes, frustrationsRes, interestsRes, proposedRes, checkinsRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("sector, onboarded_at, linkedin_url")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("user_frustrations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("user_interests")
        .select("tag_id, tags!inner(kind)", { count: "exact", head: true })
        .eq("user_id", userId)
        .in("tags.kind", ["tool", "capability"]),
      supabase
        .from("tag_suggestions")
        .select("id", { count: "exact", head: true })
        .eq("proposed_by", userId)
        .in("kind", ["tool", "capability"]),
      supabase
        .from("weekly_checkins")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("week_start", currentWeekStartUtc()),
    ])

  const profile = profileRes.data as
    | {
        sector: SectorSlug | null
        onboarded_at: string | null
        linkedin_url: string | null
      }
    | null

  return {
    sector: profile?.sector ?? null,
    hasLinkedinUrl: Boolean(profile?.linkedin_url),
    frustrationCount: frustrationsRes.count ?? 0,
    interestCount: interestsRes.count ?? 0,
    proposedToolCapabilityCount: proposedRes.count ?? 0,
    weekCheckinExists: (checkinsRes.count ?? 0) > 0,
    onboardedAt: profile?.onboarded_at ?? null,
  }
}

/**
 * Returns two human-readable lists for the system prompt:
 * - `captured`: signals already on file (positive feedback to the model)
 * - `aimFor`: nice-to-haves the model can gently steer toward
 *
 * Items in `aimFor` are HINTS — the coach is explicitly instructed not to
 * block the finish on them.
 */
export function describeCoverage(
  coverage: Coverage,
  kind: ChatKind
): { captured: string[]; aimFor: string[] } {
  const t = COVERAGE_TARGETS[kind]
  const captured: string[] = []
  const aimFor: string[] = []

  if (coverage.sector) {
    captured.push(`sector = ${coverage.sector}`)
  } else if (kind === "onboarding") {
    aimFor.push("sector via set_sector (helps the feed a lot)")
  }

  if (coverage.hasLinkedinUrl) {
    captured.push("linkedin_url stored")
  }

  captured.push(`frustrations captured: ${coverage.frustrationCount}`)
  if (coverage.frustrationCount < t.frustrations) {
    aimFor.push("at least 1 frustration via add_frustration")
  }

  const combinedInterest =
    coverage.interestCount + coverage.proposedToolCapabilityCount
  captured.push(
    `tool/capability signals: ${coverage.interestCount} stored + ${coverage.proposedToolCapabilityCount} proposed`
  )
  if (combinedInterest < t.interests) {
    aimFor.push(
      `~${t.interests} tool/capability mentions via add_interest (or propose_tag for new names)`
    )
  }

  if (kind === "checkin") {
    if (coverage.weekCheckinExists) {
      captured.push("weekly check-in saved for current week")
    } else {
      aimFor.push(
        "weekly check-in body for the current UTC week via save_weekly_checkin"
      )
    }
  }

  return { captured, aimFor }
}
