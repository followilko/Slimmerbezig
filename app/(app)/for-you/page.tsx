import { PostCard } from "@/components/post/post-card"
import { Badge } from "@/components/ui/badge"
import { requireOnboarded } from "@/lib/auth/onboarding"
import { POSTS } from "@/lib/dummy/posts"
import { displayNameFor, getViewer } from "@/lib/profile/get-viewer-profile"

export default async function ForYouPage() {
  const viewer = await getViewer()
  requireOnboarded(viewer?.profile ?? null)

  const profile = viewer!.profile
  const givenName =
    profile?.given_name ??
    displayNameFor(profile)?.split(" ")[0]?.trim() ??
    null

  // TODO: re-wire to supabase.rpc("get_recommended_hacks") once schema deltas
  // (post_type, structured title, tool tags, org, praise/points) land.
  const posts = POSTS

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 pb-12 pt-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Suggested{givenName ? `, ${givenName}` : ""}
            <Badge variant="secondary" className="ml-2 align-middle normal-case">
              {posts.length}
            </Badge>
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Posts afgestemd op je sector, frustraties en tools. Markeer wat werkt
            — je feed leert ervan.
          </p>
        </div>
        {profile?.sector ? (
          <Badge variant="secondary" className="normal-case">
            {profile.sector}
          </Badge>
        ) : null}
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
