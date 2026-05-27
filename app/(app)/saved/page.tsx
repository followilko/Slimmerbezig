import { PostCard } from "@/components/post/post-card"
import { EmptyStateCard } from "@/components/shell/empty-state"
import { PageHeader, PageShell } from "@/components/shell/page-header"
import { requireOnboarded } from "@/lib/auth/onboarding"
import { getPostMeta } from "@/lib/dummy/posts"
import { getViewer } from "@/lib/profile/get-viewer-profile"
import { createClient } from "@/lib/supabase/server"

type SavedRow = {
  hack_id: string
  created_at: string
  hacks: { id: string; status: string } | null
}

export default async function SavedPage() {
  const viewer = await getViewer()
  requireOnboarded(viewer?.profile ?? null)

  const userId = viewer!.userId
  const supabase = await createClient()

  // Join hack_interactions → hacks so we can filter out archived/draft rows
  // and order by when the user saved them (newest first).
  const { data } = await supabase
    .from("hack_interactions")
    .select("hack_id, created_at, hacks!inner(id, status)")
    .eq("user_id", userId)
    .eq("kind", "saved")
    .order("created_at", { ascending: false })

  const rows = ((data ?? []) as unknown as SavedRow[]).filter(
    (r) => r.hacks?.status === "published"
  )

  const posts = rows.flatMap((r) => {
    const meta = getPostMeta(r.hack_id)
    if (!meta) return []
    return [{ id: r.hack_id, ...meta }]
  })
  const count = posts.length

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
          description="Tik op het hartje op een post in Suggested — die verschijnt hier en de teller in de header loopt mee."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} saved />
          ))}
        </div>
      )}
    </PageShell>
  )
}
