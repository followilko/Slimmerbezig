export type PostType = "bite" | "recipe" | "guide" | "external"

/** Slugs match simple-icons (lowercase, no separator). */
export type ToolSlug =
  | "photoshop"
  | "chatgpt"
  | "claude"
  | "googlegemini"
  | "microsoftexcel"
  | "figma"
  | "notion"
  | "linear"
  | "googlesheets"

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

export type Post = {
  id: string
  postType: PostType
  estimatedMinutes: number
  title: {
    action: string
    tool: { slug: ToolSlug; label: string }
  }
  author: PostAuthor
  publishedAt: string
  editedAt: string | null
  metrics: { likes: number; comments: number; points: number }
  completedByPeers: PostPeer[]
  totalPeerCompletions: number
  saved: boolean
}

/** Assembles the canonical post title from structured parts. */
export function formatPostTitle(post: Pick<Post, "title">): string {
  const { action, tool } = post.title
  return `how to ${action} in ${tool.label}`
}

export function getPostById(id: string): Post | undefined {
  return POSTS.find((p) => p.id === id)
}

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

export const POSTS: Post[] = [
  {
    id: "post-photoshop-ai-actions",
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
    saved: true,
  },
  {
    id: "post-chatgpt-standup",
    postType: "bite",
    estimatedMinutes: 5,
    title: {
      action: "draft standup notes from yesterday's commits",
      tool: { slug: "chatgpt", label: "ChatGPT" },
    },
    author: {
      id: "author-maria",
      name: "Maria van der Berg",
      role: "Product Manager",
      organization: "Flowstack",
      avatarUrl: null,
    },
    publishedAt: daysAgo(1),
    editedAt: null,
    metrics: { likes: 8, comments: 1, points: 45 },
    completedByPeers: [{ name: "Tom", avatarUrl: null }],
    totalPeerCompletions: 1,
    saved: false,
  },
  {
    id: "post-excel-pivot",
    postType: "guide",
    estimatedMinutes: 45,
    title: {
      action: "build a pivot table from messy CSV exports",
      tool: { slug: "microsoftexcel", label: "Excel" },
    },
    author: {
      id: "author-jan",
      name: "Jan de Vries",
      role: "Finance Analyst",
      organization: "Northwind BV",
      avatarUrl: null,
    },
    publishedAt: daysAgo(5),
    editedAt: daysAgo(3),
    metrics: { likes: 24, comments: 7, points: 210 },
    completedByPeers: [
      { name: "Lisa", avatarUrl: null },
      { name: "Mark", avatarUrl: null },
    ],
    totalPeerCompletions: 5,
    saved: false,
  },
  {
    id: "post-figma-auto-layout",
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
    saved: false,
  },
  {
    id: "post-notion-meeting-notes",
    postType: "bite",
    estimatedMinutes: 3,
    title: {
      action: "summarise meeting notes into action items",
      tool: { slug: "notion", label: "Notion" },
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
    metrics: { likes: 5, comments: 0, points: 32 },
    completedByPeers: [{ name: "Noor", avatarUrl: null }],
    totalPeerCompletions: 2,
    saved: true,
  },
  {
    id: "post-claude-code-review",
    postType: "recipe",
    estimatedMinutes: 25,
    title: {
      action: "run a structured code review on pull requests",
      tool: { slug: "claude", label: "Claude" },
    },
    author: {
      id: "author-david",
      name: "David Okonkwo",
      role: "Staff Engineer",
      organization: "Cloudnine",
      avatarUrl: null,
    },
    publishedAt: daysAgo(4),
    editedAt: daysAgo(2),
    metrics: { likes: 19, comments: 6, points: 156 },
    completedByPeers: [
      { name: "Emma", avatarUrl: null },
      { name: "Ruben", avatarUrl: null },
      { name: "Fatima", avatarUrl: null },
    ],
    totalPeerCompletions: 8,
    saved: false,
  },
  {
    id: "post-gemini-research",
    postType: "external",
    estimatedMinutes: 10,
    title: {
      action: "research competitors with grounded search",
      tool: { slug: "googlegemini", label: "Gemini" },
    },
    author: {
      id: "author-curator",
      name: "Slimmerbezig Curator",
      role: "Content Curator",
      organization: "Slimmerbezig",
      avatarUrl: null,
    },
    publishedAt: daysAgo(10),
    editedAt: null,
    metrics: { likes: 31, comments: 2, points: 67 },
    completedByPeers: [{ name: "Kees", avatarUrl: null }],
    totalPeerCompletions: 1,
    saved: false,
  },
  {
    id: "post-linear-triage",
    postType: "bite",
    estimatedMinutes: 5,
    title: {
      action: "triage inbox issues with an AI label pass",
      tool: { slug: "linear", label: "Linear" },
    },
    author: {
      id: "author-nina",
      name: "Nina Patel",
      role: "Engineering Manager",
      organization: "Stackwise",
      avatarUrl: null,
    },
    publishedAt: daysAgo(6),
    editedAt: null,
    metrics: { likes: 11, comments: 2, points: 54 },
    completedByPeers: [{ name: "Jeroen", avatarUrl: null }],
    totalPeerCompletions: 4,
    saved: false,
  },
  {
    id: "post-sheets-dashboard",
    postType: "guide",
    estimatedMinutes: 50,
    title: {
      action: "build a live KPI dashboard from Sheets data",
      tool: { slug: "googlesheets", label: "Google Sheets" },
    },
    author: {
      id: "author-eva",
      name: "Eva Jansen",
      role: "Marketing Analyst",
      organization: "Growthlab",
      avatarUrl: null,
    },
    publishedAt: daysAgo(14),
    editedAt: daysAgo(12),
    metrics: { likes: 42, comments: 9, points: 287 },
    completedByPeers: [
      { name: "Tim", avatarUrl: null },
      { name: "Roos", avatarUrl: null },
    ],
    totalPeerCompletions: 6,
    saved: false,
  },
  {
    id: "post-photoshop-batch-export",
    postType: "recipe",
    estimatedMinutes: 18,
    title: {
      action: "batch-export social assets with generative fill",
      tool: { slug: "photoshop", label: "Photoshop" },
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
    saved: true,
  },
]
