export type PostType = "bite" | "recipe" | "guide" | "external"

/** Tool slugs; each must have a matching row in `lib/brands/manifest.ts`. */
export type ToolSlug =
  | "photoshop"
  | "figma"
  | "framer"
  | "notion"
  | "zoom"
  | "cursor"
  | "claude"
  | "dovetail"
  | "lovable"

export const POST_TYPE_LABEL: Record<PostType, string> = {
  bite: "Mini Hack",
  recipe: "Recipe",
  guide: "Guide",
  external: "Link",
}

export type PostAuthor = {
  id: string
  name: string
  role: string
  organization: string
  organizationHref?: string
  avatarUrl: string | null
}

export type PostPeer = {
  name: string
  avatarUrl: string | null
}

/**
 * Post = UI shape rendered by <PostCard />. Identity + canonical title come
 * from public.hacks; the rest (postType, estimatedMinutes, structured title,
 * author block, peers, metrics) lives only in TypeScript metadata until the
 * B2B-MVP migration adds the matching columns.
 */
export type Post = {
  id: string
  postType: PostType
  estimatedMinutes: number
  title: {
    action: string
    tool: { slug: ToolSlug; label: string } | null
    /**
     * Optional full, free-form headline (user-authored hacks). When set, this is
     * the canonical title and the card renders it verbatim (with an inline tool
     * icon where a known tool name is recognised). Legacy/seeded posts leave this
     * undefined and fall back to the `how to {action} in {tool}` template.
     */
    text?: string
  }
  author: PostAuthor
  publishedAt: string
  editedAt: string | null
  metrics: { likes: number; comments: number; points: number }
  completedByPeers: PostPeer[]
  totalPeerCompletions: number
}

/** Wireframe-only metadata; merged onto each public.hacks row by id. */
export type PostMeta = Omit<Post, "id">

/** Assembles the canonical post title from structured parts (or free text). */
export function formatPostTitle(post: Pick<Post, "title">): string {
  const { action, tool, text } = post.title
  if (text?.trim()) return text.trim()
  return tool ? `how to ${action} in ${tool.label}` : `how to ${action}`
}

export function getPostById(id: string): Post | undefined {
  return POSTS.find((p) => p.id === id)
}

/** Lookup decorating metadata for a `hacks.id`. Returns undefined for un-seeded rows. */
export function getPostMeta(id: string): PostMeta | undefined {
  return POST_META_BY_ID[id]
}

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

/**
 * Hardcoded UUIDs mirror supabase/08_seed_dummy_posts.sql 1:1.
 * Keep both files in lock-step; the SQL seed is the source of truth for `id`.
 */
export const POST_META_BY_ID: Record<string, PostMeta> = {
  "aaaaaaaa-0001-0001-0001-000000000001": {
    postType: "recipe",
    estimatedMinutes: 20,
    title: {
      action: "automate edits with AI-actions",
      tool: { slug: "photoshop", label: "Photoshop" },
    },
    author: {
      id: "author-eelco",
      name: "Eelco Guntlisbergen",
      role: "Digital Product Designer",
      organization: "Achmea impact ventures",
      avatarUrl: null,
    },
    publishedAt: daysAgo(2),
    editedAt: daysAgo(1),
    metrics: { likes: 12, comments: 3, points: 123 },
    completedByPeers: [
      { name: "Arjan", avatarUrl: null },
      { name: "Sanne", avatarUrl: null },
      { name: "Pieter", avatarUrl: null },
    ],
    totalPeerCompletions: 3,
  },
  "aaaaaaaa-0001-0001-0001-000000000002": {
    postType: "recipe",
    estimatedMinutes: 18,
    title: {
      action: "build a working web app from one prompt",
      tool: { slug: "lovable", label: "Lovable" },
    },
    author: {
      id: "author-lars",
      name: "Lars Meijer",
      role: "Visual Designer",
      organization: "Pixelwerk",
      avatarUrl: null,
    },
    publishedAt: daysAgo(8),
    editedAt: null,
    metrics: { likes: 14, comments: 3, points: 98 },
    completedByPeers: [{ name: "Iris", avatarUrl: null }],
    totalPeerCompletions: 2,
  },
  "aaaaaaaa-0001-0001-0001-000000000003": {
    postType: "recipe",
    estimatedMinutes: 15,
    title: {
      action: "speed up handoff with auto-layout tokens",
      tool: { slug: "figma", label: "Figma" },
    },
    author: {
      id: "author-sophie",
      name: "Sophie Bakker",
      role: "UX Designer",
      organization: "Studio Oranje",
      avatarUrl: null,
    },
    publishedAt: daysAgo(3),
    editedAt: null,
    metrics: { likes: 16, comments: 4, points: 88 },
    completedByPeers: [],
    totalPeerCompletions: 0,
  },
  "aaaaaaaa-0001-0001-0001-000000000004": {
    postType: "bite",
    estimatedMinutes: 5,
    title: {
      action: "generate ad variants from one master frame",
      tool: { slug: "figma", label: "Figma" },
    },
    author: {
      id: "author-eva",
      name: "Eva Jansen",
      role: "Marketing Designer",
      organization: "Growthlab",
      avatarUrl: null,
    },
    publishedAt: daysAgo(6),
    editedAt: null,
    metrics: { likes: 22, comments: 5, points: 71 },
    completedByPeers: [
      { name: "Tim", avatarUrl: null },
      { name: "Roos", avatarUrl: null },
    ],
    totalPeerCompletions: 4,
  },
  "aaaaaaaa-0001-0001-0001-000000000005": {
    postType: "recipe",
    estimatedMinutes: 25,
    title: {
      action: "build a landing page from a single prompt",
      tool: { slug: "framer", label: "Framer" },
    },
    author: {
      id: "author-maria",
      name: "Maria van der Berg",
      role: "Brand Designer",
      organization: "Flowstack",
      avatarUrl: null,
    },
    publishedAt: daysAgo(4),
    editedAt: daysAgo(2),
    metrics: { likes: 31, comments: 6, points: 142 },
    completedByPeers: [{ name: "Tom", avatarUrl: null }],
    totalPeerCompletions: 5,
  },
  "aaaaaaaa-0001-0001-0001-000000000006": {
    postType: "bite",
    estimatedMinutes: 3,
    title: {
      action: "turn user interviews into tagged insights",
      tool: { slug: "dovetail", label: "Dovetail" },
    },
    author: {
      id: "author-alex",
      name: "Alex Chen",
      role: "Operations Lead",
      organization: "Brightpath",
      avatarUrl: null,
    },
    publishedAt: daysAgo(7),
    editedAt: null,
    metrics: { likes: 9, comments: 0, points: 32 },
    completedByPeers: [{ name: "Noor", avatarUrl: null }],
    totalPeerCompletions: 2,
  },
  "aaaaaaaa-0001-0001-0001-000000000007": {
    postType: "recipe",
    estimatedMinutes: 20,
    title: {
      action: "refactor a legacy module with agent mode",
      tool: { slug: "cursor", label: "Cursor" },
    },
    author: {
      id: "author-jan",
      name: "Jan de Vries",
      role: "Chief of Staff",
      organization: "Northwind BV",
      avatarUrl: null,
    },
    publishedAt: daysAgo(10),
    editedAt: daysAgo(4),
    metrics: { likes: 27, comments: 8, points: 184 },
    completedByPeers: [
      { name: "Lisa", avatarUrl: null },
      { name: "Mark", avatarUrl: null },
    ],
    totalPeerCompletions: 6,
  },
  "aaaaaaaa-0001-0001-0001-000000000008": {
    postType: "bite",
    estimatedMinutes: 5,
    title: {
      action: "prototype an internal tool without code",
      tool: { slug: "lovable", label: "Lovable" },
    },
    author: {
      id: "author-nina",
      name: "Nina Patel",
      role: "Customer Success Manager",
      organization: "Stackwise",
      avatarUrl: null,
    },
    publishedAt: daysAgo(1),
    editedAt: null,
    metrics: { likes: 17, comments: 2, points: 58 },
    completedByPeers: [{ name: "Jeroen", avatarUrl: null }],
    totalPeerCompletions: 3,
  },
  "aaaaaaaa-0001-0001-0001-000000000009": {
    postType: "recipe",
    estimatedMinutes: 30,
    title: {
      action: "scaffold a new feature with agent mode",
      tool: { slug: "cursor", label: "Cursor" },
    },
    author: {
      id: "author-david",
      name: "David Okonkwo",
      role: "Staff Engineer",
      organization: "Cloudnine",
      avatarUrl: null,
    },
    publishedAt: daysAgo(5),
    editedAt: null,
    metrics: { likes: 38, comments: 11, points: 247 },
    completedByPeers: [
      { name: "Emma", avatarUrl: null },
      { name: "Ruben", avatarUrl: null },
      { name: "Fatima", avatarUrl: null },
    ],
    totalPeerCompletions: 9,
  },
  "aaaaaaaa-0001-0001-0001-000000000010": {
    postType: "recipe",
    estimatedMinutes: 25,
    title: {
      action: "cluster survey responses into themes",
      tool: { slug: "dovetail", label: "Dovetail" },
    },
    author: {
      id: "author-curator",
      name: "Slimmerbezig Curator",
      role: "Content Curator",
      organization: "Slimmerbezig",
      avatarUrl: null,
    },
    publishedAt: daysAgo(14),
    editedAt: daysAgo(12),
    metrics: { likes: 42, comments: 9, points: 287 },
    completedByPeers: [{ name: "Kees", avatarUrl: null }],
    totalPeerCompletions: 7,
  },
}

/** Derived list — every PostCard surface eventually replaces this with DB rows. */
export const POSTS: Post[] = Object.entries(POST_META_BY_ID).map(
  ([id, meta]) => ({ id, ...meta })
)
