import { z } from "zod"

import { BRAND_MANIFEST } from "@/lib/brands/manifest"

export const POST_TYPES = ["bite", "recipe", "guide", "external"] as const
export const GOALS = [
  "automate",
  "analyse",
  "generate",
  "organise",
  "communicate",
  "learn",
  "decide",
] as const

/** Known tool slugs the model may pick from (else null -> fallback brand). */
export const KNOWN_TOOL_SLUGS = Object.keys(BRAND_MANIFEST)

/** Max pasted conversation length (also caps fetched URL text). */
export const MAX_CONVERSATION_CHARS = 100_000

/**
 * Structured, PII-free hack draft produced from a conversation/URL.
 * `title` is the action phrase only (e.g. "automate weekly status reports"),
 * which slots into the card's "how to {title} in {tool}" layout.
 */
export const hackDraftSchema = z.object({
  title: z.string().min(3).max(120),
  toolSlug: z.string().nullable(),
  toolLabel: z.string().nullable(),
  postType: z.enum(POST_TYPES),
  estimatedMinutes: z.number().int().min(1).max(240),
  goal: z.enum(GOALS).nullable(),
  summary: z.string().min(10).max(400),
  bodyMd: z.string().min(20).max(8000),
  suggestedTagSlugs: z.array(z.string().max(48)).max(12),
  suggestedChannelSlugs: z.array(z.string().max(48)).max(6),
})

export type HackDraft = z.infer<typeof hackDraftSchema>

export const HACK_GENERATION_SYSTEM_PROMPT = `Je bent de redacteur van Slimmerbezig. Je zet een AI-gesprek of artikel om in één herbruikbare, leerbare "hack" voor collega's.

ABSOLUTE PRIVACY-REGEL (belangrijkste taak):
- Verwijder ALLE persoonlijke en vertrouwelijke informatie. Nooit: namen van personen, e-mailadressen, telefoonnummers, bedrijfsnamen, klantnamen, projectcodenamen, interne URLs, API-keys, bedragen of cijfers die herleidbaar zijn, of andere gevoelige/confidentiële details.
- Generaliseer: vervang specifieke gevallen door neutrale, herbruikbare formuleringen ("een klant" i.p.v. een naam, "een marketingteam" i.p.v. een bedrijf).
- Bij twijfel: weglaten. De output mag NOOIT herleidbaar zijn naar een persoon of organisatie.

OUTPUT-EISEN:
- title: alleen de actie-frase in kleine letters, zonder "hoe" of toolnaam, bv. "wekelijkse rapportages automatiseren". Max 120 tekens.
- toolSlug: kies één slug uit de toegestane lijst als het gesprek duidelijk over die tool gaat, anders null.
- toolLabel: nette weergavenaam van de tool, of null.
- postType: bite (<5 min), recipe (5-30 min), guide (30+ min), external (link naar externe content).
- estimatedMinutes: realistische schatting.
- goal: één van de toegestane doelen, of null.
- summary: 1-3 zinnen, wervend maar feitelijk, geen PII.
- bodyMd: heldere markdown met stappen die iemand zelf kan uitvoeren. Geen PII.
- suggestedTagSlugs: lower_snake_case tools/capabilities.
- suggestedChannelSlugs: relevante kanaal-slugs.

Schrijf in het Nederlands, praktisch en concreet.`

export function buildHackGenerationPrompt(input: {
  sourceType: "url" | "conversation"
  text: string
}): string {
  const allowedTools = KNOWN_TOOL_SLUGS.join(", ")
  const allowedGoals = GOALS.join(", ")
  const allowedTypes = POST_TYPES.join(", ")
  const sourceLabel =
    input.sourceType === "url" ? "Opgehaalde pagina-inhoud" : "Geplakt AI-gesprek"

  return [
    `Toegestane toolSlug-waarden: ${allowedTools} (of null).`,
    `Toegestane goal-waarden: ${allowedGoals} (of null).`,
    `Toegestane postType-waarden: ${allowedTypes}.`,
    "",
    `${sourceLabel} (ruwe input — bevat mogelijk PII, verwijder die volledig):`,
    "---",
    input.text,
    "---",
    "Geef uitsluitend de gestructureerde hack terug. Geen PII.",
  ].join("\n")
}

// ─── Screenshot (vision) capture ──────────────────────────────────────────────
export const MAX_SCREENSHOTS = 4
/** Per-image cap after client downscale (keeps total payload under Vercel limits). */
export const MAX_IMAGE_BYTES = 1_500_000

const ALLOWED_IMAGE_MEDIA = /^data:image\/(png|jpeg|webp);base64,/i

export const SCREENSHOT_INSTRUCTION = `

SCREENSHOT-INSTRUCTIE:
- Lees het AI-gesprek uit de bijgevoegde screenshot(s) (OCR). Negeer UI-chrome (navigatie, sidebars, knoppen).
- Meerdere afbeeldingen kunnen opeenvolgende delen van hetzelfde gesprek tonen — combineer ze tot één coherent verhaal.
- Pas dezelfde ABSOLUTE PRIVACY-REGEL toe op alles wat je uit de afbeeldingen leest.`

function allowedValuesText(): string {
  return [
    `Toegestane toolSlug-waarden: ${KNOWN_TOOL_SLUGS.join(", ")} (of null).`,
    `Toegestane goal-waarden: ${GOALS.join(", ")} (of null).`,
    `Toegestane postType-waarden: ${POST_TYPES.join(", ")}.`,
    "",
    "Screenshot(s) van een AI-gesprek (ruwe input — bevat mogelijk PII, verwijder die volledig):",
    "Geef uitsluitend de gestructureerde hack terug. Geen PII.",
  ].join("\n")
}

export type ScreenshotContentPart =
  | { type: "text"; text: string }
  | { type: "image"; image: string; mediaType?: string }

/** AI SDK user content for vision-based hack generation. */
export function buildScreenshotUserContent(
  images: string[]
): ScreenshotContentPart[] {
  return [
    { type: "text", text: allowedValuesText() },
    ...images.map((image) => ({
      type: "image" as const,
      image,
      mediaType: mediaTypeFromDataUrl(image),
    })),
  ]
}

function mediaTypeFromDataUrl(dataUrl: string): string | undefined {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,/i.exec(dataUrl)
  return match?.[1]
}

function base64PayloadBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",")
  if (comma < 0) return 0
  const b64 = dataUrl.slice(comma + 1)
  return Math.floor((b64.length * 3) / 4)
}

/** Validate a client-supplied image data URL (type + size). */
export function validateScreenshotDataUrl(value: string): boolean {
  if (!value || !ALLOWED_IMAGE_MEDIA.test(value)) return false
  return base64PayloadBytes(value) <= MAX_IMAGE_BYTES
}

// ─── PII scrub (defense-in-depth on model output) ───────────────────────────
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi
const PHONE_RE = /(?:(?:\+|00)\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?){2,4}\d{2,4}/g
const REDACTED = "[verwijderd]"

export function scrubPii(text: string): string {
  if (!text) return text
  return text.replace(EMAIL_RE, REDACTED).replace(PHONE_RE, (m) =>
    (m.replace(/\D/g, "").length >= 7 ? REDACTED : m)
  )
}

export function scrubDraft(draft: HackDraft): HackDraft {
  return {
    ...draft,
    title: scrubPii(draft.title),
    summary: scrubPii(draft.summary),
    bodyMd: scrubPii(draft.bodyMd),
  }
}
