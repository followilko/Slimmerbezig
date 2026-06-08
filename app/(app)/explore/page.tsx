import { ExploreInfiniteGrid } from "@/components/feed/explore-infinite-grid"
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

  if (items.length < 1) {
    return (
      <div className="flex w-full flex-1 flex-col gap-6 px-4 pb-12 pt-6 sm:px-6">
        <header className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Explore{givenName ? `, ${givenName}` : ""}
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Ontdek hacks van professionals bij andere organisaties. Markeer wat
            werkt — je feed leert ervan.
          </p>
        </header>
        <p className="text-muted-foreground text-sm">
          Er is nog geen content om te tonen. Kom later terug.
        </p>
      </div>
    )
  }

  return (
    // Pull the grid up under the sticky header (-mt) and neutralise the main's
    // bottom padding (-mb) so the infinite grid is full-bleed. The header's
    // .glass-bg then blurs the moving cards behind it instead of a flat panel.
    <div className="relative -mt-[5.25rem] -mb-32 flex h-[100dvh] flex-col overflow-hidden">
      <ExploreInfiniteGrid items={items} />
    </div>
  )
}
