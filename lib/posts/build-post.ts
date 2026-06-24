import { BRAND_MANIFEST, isBrandSlug } from "@/lib/brands/manifest"
import type { HackDraft } from "@/lib/ai/hack-draft"
import type { Post, PostType, ToolSlug } from "@/lib/dummy/posts"

/**
 * Pure helpers that build the UI `Post` shape from a DB hack row or an
 * in-memory generated draft — no server/Supabase imports, so they are safe to
 * use in client components (e.g. the post-maker preview).
 */

export type AuthorLite = {
  id: string
  full_name: string | null
  given_name: string | null
  family_name: string | null
  avatar_url: string | null
  headline: string | null
} | null

export type HackRowForPost = {
  id: string
  title: string
  created_at: string
  post_type?: string | null
  primary_tool_slug?: string | null
  estimated_minutes?: number | null
  author_id?: string | null
}

const POST_TYPES: ReadonlyArray<PostType> = ["bite", "recipe", "guide", "external"]

function normalizePostType(value: string | null | undefined): PostType {
  return value && (POST_TYPES as readonly string[]).includes(value)
    ? (value as PostType)
    : "recipe"
}

/** Brand label for a known slug, otherwise a humanized version of the slug. */
export function toolLabelFor(slug: string): string {
  if (isBrandSlug(slug)) return BRAND_MANIFEST[slug].label
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export type DetectedTool = {
  slug: ToolSlug
  label: string
  /** Match span within the searched title (for inline icon rendering). */
  start: number
  end: number
}

/**
 * Scan a free-form title for a known tool name (whole-word, case-insensitive)
 * so the front-end can show the brand icon next to it. Prefers the *last* match,
 * which lines up with the natural "… in {Tool}" phrasing at the end of a title.
 */
export function detectToolInTitle(text: string): DetectedTool | null {
  if (!text) return null
  let best: DetectedTool | null = null
  for (const entry of Object.values(BRAND_MANIFEST)) {
    const re = new RegExp(`\\b${escapeRegExp(entry.label)}\\b`, "gi")
    let match: RegExpExecArray | null
    while ((match = re.exec(text)) !== null) {
      const start = match.index
      if (!best || start > best.start) {
        best = { slug: entry.slug, label: entry.label, start, end: start + match[0].length }
      }
    }
  }
  return best
}

/** Default editable headline for a freshly generated draft. */
export function composeDefaultTitle(draft: {
  title: string
  toolLabel?: string | null
  toolSlug?: string | null
}): string {
  const action = draft.title.trim()
  const label =
    draft.toolLabel?.trim() ||
    (draft.toolSlug ? toolLabelFor(draft.toolSlug.trim()) : "")
  return label ? `how to ${action} in ${label}` : `how to ${action}`
}

/** Resolve the branding tool for a free-form title: detection first, slug fallback. */
function toolForTitle(
  text: string,
  slug?: string | null,
  label?: string | null
) {
  const detected = detectToolInTitle(text)
  if (detected) return { slug: detected.slug, label: detected.label }
  return toolFromSlug(slug ?? null, label)
}

function toolFromSlug(slug: string | null, explicitLabel?: string | null) {
  const trimmed = slug?.trim()
  if (!trimmed) return null
  return {
    slug: trimmed as ToolSlug,
    label: explicitLabel?.trim() || toolLabelFor(trimmed),
  }
}

function authorName(author: AuthorLite): string {
  if (!author) return "Collega"
  const full = author.full_name?.trim()
  if (full) return full
  const combined = [author.given_name, author.family_name]
    .filter(Boolean)
    .join(" ")
    .trim()
  return combined || "Collega"
}

/** Build a `Post` from a published DB hack row (no TS dummy metadata needed). */
export function buildPostFromHackRow(
  row: HackRowForPost,
  author: AuthorLite
): Post {
  return {
    id: row.id,
    postType: normalizePostType(row.post_type),
    estimatedMinutes: row.estimated_minutes ?? 0,
    title: {
      action: row.title,
      tool: toolForTitle(row.title, row.primary_tool_slug ?? null),
      text: row.title,
    },
    author: {
      id: author?.id ?? row.author_id ?? "unknown",
      name: authorName(author),
      role: author?.headline ?? "",
      organization: "",
      avatarUrl: author?.avatar_url ?? null,
    },
    publishedAt: row.created_at,
    editedAt: null,
    metrics: { likes: 0, comments: 0, points: 0 },
    completedByPeers: [],
    totalPeerCompletions: 0,
  }
}

export type DraftAuthorLite = {
  name: string
  headline?: string | null
  avatarUrl?: string | null
}

/** Build a preview `Post` from a generated draft (used by the post-maker preview). */
export function buildPostFromDraft(
  draft: HackDraft,
  author: DraftAuthorLite
): Post {
  return {
    id: "preview",
    postType: normalizePostType(draft.postType),
    estimatedMinutes: draft.estimatedMinutes,
    title: {
      action: draft.title,
      tool: toolForTitle(draft.title, draft.toolSlug, draft.toolLabel),
      text: draft.title,
    },
    author: {
      id: "me",
      name: author.name,
      role: author.headline ?? "",
      organization: "",
      avatarUrl: author.avatarUrl ?? null,
    },
    publishedAt: new Date().toISOString(),
    editedAt: null,
    metrics: { likes: 0, comments: 0, points: 250 },
    completedByPeers: [],
    totalPeerCompletions: 0,
  }
}
