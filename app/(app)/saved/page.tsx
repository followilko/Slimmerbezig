import { PostCard } from "@/components/post/post-card"
import { EmptyStateCard } from "@/components/shell/empty-state"
import { PageHeader, PageShell } from "@/components/shell/page-header"
import { requireOnboarded } from "@/lib/auth/onboarding"
import { getViewer } from "@/lib/profile/get-viewer-profile"
import {
  buildFeedItems,
  loadReactionMap,
  type HackFeedRow,
} from "@/lib/posts/feed-items"
import { createClient } from "@/lib/supabase/server"

type SavedRow = {
  hack_id: string
  created_at: string
  hacks: {
    id: string
    status: string
    title: string
    summary: string | null
    post_type: string | null
    primary_tool_slug: string | null
    estimated_minutes: number | null
    author_id: string | null
  } | null
}

export default async function SavedPage() {
  const viewer = await getViewer()
  requireOnboarded(viewer?.profile ?? null)

  const userId = viewer!.userId
  const supabase = await createClient()

  const { data } = await supabase
    .from("hack_interactions")
    .select(
      "hack_id, created_at, hacks!inner(id, status, title, summary, post_type, primary_tool_slug, estimated_minutes, author_id)"
    )
    .eq("user_id", userId)
    .eq("kind", "saved")
    .order("created_at", { ascending: false })

  const rows = ((data ?? []) as unknown as SavedRow[]).filter(
    (r) => r.hacks?.status === "published"
  )

  const hacks: HackFeedRow[] = rows.flatMap((r) => {
    if (!r.hacks) return []
    return [
      {
        id: r.hack_id,
        title: r.hacks.title,
        summary: r.hacks.summary,
        status: r.hacks.status,
        created_at: r.created_at,
        post_type: r.hacks.post_type,
        primary_tool_slug: r.hacks.primary_tool_slug,
        estimated_minutes: r.hacks.estimated_minutes,
        author_id: r.hacks.author_id,
      },
    ]
  })

  const reactionMap = await loadReactionMap(
    userId,
    hacks.map((h) => h.id)
  )
  const savedIds = new Set(hacks.map((h) => h.id))
  const items = await buildFeedItems(hacks, savedIds, reactionMap)
  const count = items.length

  return (
    <PageShell>
      <PageHeader
        title="Saved"
        description={
          count > 0
            ? `Je hebt ${count} post${count === 1 ? "" : "s"} opgeslagen.`
            : "Posts die je opslaat verschijnen hier."
        }
      />

      {count === 0 ? (
        <EmptyStateCard
          title="Nog niets opgeslagen"
          description="Tik op het hartje op een post in Explore — die verschijnt hier en de teller in de header loopt mee."
        />
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ post, summary, saved, reactions }) => (
            <PostCard
              key={post.id}
              post={post}
              summary={summary}
              saved={saved}
              reactions={reactions}
            />
          ))}
        </div>
      )}
    </PageShell>
  )
}
