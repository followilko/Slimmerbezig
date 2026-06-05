import { PostCard } from "@/components/post/post-card"
import { Badge } from "@/components/ui/badge"
import { requireOnboarded } from "@/lib/auth/onboarding"
import { displayNameFor, getViewer } from "@/lib/profile/get-viewer-profile"
import {
  fetchRecommendedHacks,
  prepareFeedFromHacks,
} from "@/lib/posts/feed-items"

export default async function ExplorePage() {
  const viewer = await getViewer()
  requireOnboarded(viewer?.profile ?? null)

  const profile = viewer!.profile
  const userId = viewer!.userId
  const givenName =
    profile?.given_name ??
    displayNameFor(profile)?.split(" ")[0]?.trim() ??
    null

  const hacks = await fetchRecommendedHacks(20)
  const items = await prepareFeedFromHacks(userId, hacks)

  return (
    <div className="flex w-full flex-1 flex-col gap-6 px-4 pb-12 pt-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Explore{givenName ? `, ${givenName}` : ""}
            <Badge variant="secondary" className="ml-2 align-middle normal-case">
              {items.length}
            </Badge>
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Ontdek hacks van professionals bij andere organisaties. Markeer wat
            werkt — je feed leert ervan.
          </p>
        </div>
        {profile?.sector ? (
          <Badge variant="secondary" className="normal-case">
            {profile.sector}
          </Badge>
        ) : null}
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
