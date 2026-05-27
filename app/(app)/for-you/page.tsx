import { PostCard } from "@/components/post/post-card"
import { Badge } from "@/components/ui/badge"
import { requireOnboarded } from "@/lib/auth/onboarding"
import { getPostMeta } from "@/lib/dummy/posts"
import { displayNameFor, getViewer } from "@/lib/profile/get-viewer-profile"
import { createClient } from "@/lib/supabase/server"

type HackRow = {
  id: string
  title: string
  summary: string | null
  status: string
  created_at: string
}

export default async function ForYouPage() {
  const viewer = await getViewer()
  requireOnboarded(viewer?.profile ?? null)

  const profile = viewer!.profile
  const userId = viewer!.userId
  const givenName =
    profile?.given_name ??
    displayNameFor(profile)?.split(" ")[0]?.trim() ??
    null

  const supabase = await createClient()

  // Primary: tag-overlap recs. Users with no overlap (or empty result) fall
  // back to recent published hacks so the feed is never empty.
  const { data: recs } = await supabase.rpc("get_recommended_hacks", {
    p_limit: 20,
  })
  let hacks: HackRow[] = (recs ?? []) as HackRow[]

  if (hacks.length === 0) {
    const { data: fallback } = await supabase
      .from("hacks")
      .select("id, title, summary, status, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(20)
    hacks = (fallback ?? []) as HackRow[]
  }

  const { data: savedRows } = await supabase
    .from("hack_interactions")
    .select("hack_id")
    .eq("user_id", userId)
    .eq("kind", "saved")
  const savedIds = new Set((savedRows ?? []).map((r) => r.hack_id))

  // Decorate DB rows with UI metadata. Rows without a meta entry (e.g. future
  // curator inserts) are skipped silently — they'll surface once seeded in TS.
  const posts = hacks.flatMap((h) => {
    const meta = getPostMeta(h.id)
    if (!meta) return []
    return [{ post: { id: h.id, ...meta }, saved: savedIds.has(h.id) }]
  })

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
        {posts.map(({ post, saved }) => (
          <PostCard
            key={post.id}
            post={post}
            saved={saved}
            enableViewTracking
          />
        ))}
      </div>
    </div>
  )
}
