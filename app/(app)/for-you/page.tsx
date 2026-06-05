import { PostCard } from "@/components/post/post-card"
import {
  SUGGESTED_TILE_COUNT,
  SuggestedDepthFeed,
} from "@/components/feed/suggested-depth-feed"
import { requireOnboarded } from "@/lib/auth/onboarding"
import { displayNameFor, getViewer } from "@/lib/profile/get-viewer-profile"
import {
  fetchRecommendedHacks,
  prepareFeedFromHacks,
} from "@/lib/posts/feed-items"

export default async function ForYouPage() {
  const viewer = await getViewer()
  requireOnboarded(viewer?.profile ?? null)

  const profile = viewer!.profile
  const userId = viewer!.userId
  const givenName =
    profile?.given_name ??
    displayNameFor(profile)?.split(" ")[0]?.trim() ??
    null

  const hacks = await fetchRecommendedHacks(SUGGESTED_TILE_COUNT)
  const items = await prepareFeedFromHacks(userId, hacks)

  if (items.length < 2) {
    return (
      <div className="flex w-full flex-1 flex-col gap-6 px-4 pb-12 pt-6 sm:px-6">
        <header className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Suggested{givenName ? `, ${givenName}` : ""}
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Posts afgestemd op je sector, frustraties en tools.
          </p>
        </header>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ post, summary, saved, reactions }) => (
            <PostCard
              key={post.id}
              post={post}
              summary={summary}
              saved={saved}
              reactions={reactions}
              enableViewTracking
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-[calc(100dvh-4.5rem)] flex-1 flex-col overflow-hidden -mb-32">
      <p className="font-heading pointer-events-none absolute left-4 top-4 z-10 text-sm font-medium text-zinc-600 sm:left-6">
        Suggested{givenName ? `, ${givenName}` : ""}
      </p>

      <SuggestedDepthFeed items={items} />
    </div>
  )
}
