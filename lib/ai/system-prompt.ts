import type { ChatKind } from "./types"
import type { TagRow } from "./types"

import { currentWeekStartUtc } from "./week"

function compactTagList(tags: TagRow[]): { slug: string; label: string }[] {
  return tags.map((t) => ({ slug: t.slug, label: t.label }))
}

export function buildChatSystemPrompt(args: {
  kind: ChatKind
  vocab: {
    sector: TagRow[]
    tool: TagRow[]
    capability: TagRow[]
    frustration: TagRow[]
    topic: TagRow[]
  }
  understandingSummary?: string | null
}): string {
  const kind = args.kind
  const weekStart =
    kind === "checkin" ? currentWeekStartUtc() : ""
  const summary = args.understandingSummary?.trim() || ""
  const vocabJson = JSON.stringify({
    sector: compactTagList(args.vocab.sector),
    tool: compactTagList(args.vocab.tool),
    capability: compactTagList(args.vocab.capability),
    frustration: compactTagList(args.vocab.frustration),
    topic: compactTagList(args.vocab.topic),
  })

  const sharedRules = `
You are Slimmerbezig onboarding coach — concise, practical, respectful B2B tone.
Speak in the same natural language as the user's latest message unless they switch.
Do not collect sensitive personal details (family, politics, precise location, salaries). Keep relevance to workplace + AI tooling.

Use tools to record structured signals whenever you have confident information — never substitute tools with implied memory.
Only use topic/tag slugs that exist in VOCAB_JSON for set_sector / add_frustration (tag slugs) / add_interest.
If users mention apps or workflows not listed, call propose_tag with a normalized slug suggestion (lower_snake_case).
After meaningful updates call update_understanding with a concise 2–6 sentence factual summary plus a small structured "signals" object (keys you judge useful: sector_estimate, frustrations, tools, ai_capabilities).

Required coverage before goodbye:
${kind === "onboarding" ? "- Primary sector slug from VOCAB_JSON\n- 1–3 frustrations captured with add_frustration (body + curated frustration-topic tag slugs from VOCAB where possible)\n- At least 3 interest hints via add_interest using MIX of tool+capability slugs\n- OPTIONAL: hacks.goal-style intent (automate/analyse/etc.) can live in signals only until DB column lands" : "- Brief weekly recap\n- Reflect what consumed their bandwidth\n- add_interest and/or tags on save_weekly_checkin when appropriate"}
`

  const onboardingTools = `
Available tools:
- set_sector(sectorSlug)
- add_frustration(body, frustrationTagSlugs[])
- add_interest(toolOrCapabilitySlug[], weight?)
- update_understanding(summary, signals?)
- propose_tag(slugGuess, labelGuess, kindReason, curatorNote?)
- finish_onboarding() when required coverage is captured and confirmed (sets session completed; sets profile onboarded)
`

  const checkinTools = `
Available tools:
- add_frustration, add_interest, update_understanding, propose_tag (same as onboarding)
- save_weekly_checkin(body, tag_slugs[]) for week UTC ${weekStart}
- finish_checkin() once the week's note is coherent and persisted
`

  const header =
    kind === "onboarding"
      ? `# Mode: onboarding\nStart with a welcoming open-ended question about their role and workload. Probe gently toward missing signals.${onboardingTools}`
      : `# Mode: weekly check-in\nReconnect using their CONTEXT_SUMMARY.\nFriendly prompt: what absorbed their week, top blockers, what they wish AI could accelerate.\nToday's UTC Monday (week bucket): ${weekStart}.${checkinTools}`

  return `${sharedRules.trim()}

VOCAB_JSON (authorize slugs ONLY from here for structured tools):
${vocabJson}

CONTEXT_SUMMARY (may be empty on first onboarding):
${summary || "(none yet)"}

${header}
`.trim()
}
