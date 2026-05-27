import { PostCard } from "@/components/post/post-card"
import { EmptyStateCard } from "@/components/shell/empty-state"
import { PageHeader, PageShell } from "@/components/shell/page-header"
import { requireOnboarded } from "@/lib/auth/onboarding"
import { POSTS } from "@/lib/dummy/posts"
import { getSavedPostIds } from "@/lib/posts/saved-posts-cookie"
import { getViewer } from "@/lib/profile/get-viewer-profile"

export default async function SavedPage() {
  const viewer = await getViewer()
  requireOnboarded(viewer?.profile ?? null)

  const savedIds = await getSavedPostIds()
  const posts = POSTS.filter((post) => savedIds.has(post.id))
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
