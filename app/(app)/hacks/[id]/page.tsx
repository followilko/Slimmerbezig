import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { HackBody } from "@/components/post/detail/hack-body"
import { HackCommentsSection } from "@/components/post/detail/comments/hack-comments-section"
import { HackDetailActions } from "@/components/post/detail/hack-detail-actions"
import { HackDetailHeader } from "@/components/post/detail/hack-detail-header"
import { HackDetailMeta } from "@/components/post/detail/hack-detail-meta"
import { HackRelatedPosts } from "@/components/post/detail/hack-related-posts"
import { getBrand, brandStageStyle } from "@/lib/brands/get-brand"
import {
  buildDetailPost,
  loadHackChannels,
  loadHackComments,
  loadHackDetail,
  loadHackStats,
  loadHackTags,
  loadRelatedHacks,
  loadViewerHackState,
} from "@/lib/posts/hack-detail"
import {
  buildFeedItems,
  loadAuthorMap,
  loadReactionMap,
  loadSavedHackIds,
  type HackFeedRow,
} from "@/lib/posts/feed-items"
import { createClient } from "@/lib/supabase/server"

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params
  const hack = await loadHackDetail(id)
  if (!hack) return { title: "Post not found" }
  return { title: hack.title }
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createClient()
  const hack = await loadHackDetail(id)
  if (!hack) notFound()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [stats, tags, channels, viewerState, comments] = await Promise.all([
    loadHackStats(id),
    loadHackTags(id),
    loadHackChannels(id),
    user ? loadViewerHackState(user.id, id) : Promise.resolve({ liked: false, saved: false }),
    loadHackComments(id, user?.id ?? null),
  ])

  const authorMap = await loadAuthorMap(
    hack.author_id ? [hack.author_id] : []
  )
  const post = await buildDetailPost(
    hack,
    authorMap.get(hack.author_id ?? "") ?? null
  )

  // Merge real stats into post metrics for card/dock consistency
  post.metrics = {
    likes: stats.like_count,
    comments: stats.comment_count,
    points: post.metrics.points,
  }

  const brand = getBrand(post.title.tool?.slug)

  // Related posts
  const tagIds: string[] = []
  if (tags.length > 0) {
    const { data: tagRows } = await supabase
      .from("tags")
      .select("id")
      .in(
        "slug",
        tags.map((t) => t.slug)
      )
    tagIds.push(...(tagRows ?? []).map((r) => r.id))
  }

  const { sameAuthor, related } = await loadRelatedHacks(
    id,
    hack.author_id,
    channels.map((c) => c.id),
    tagIds
  )

  let sameAuthorItems: Awaited<ReturnType<typeof buildFeedItems>> = []
  let relatedItems: Awaited<ReturnType<typeof buildFeedItems>> = []

  if (user && (sameAuthor.length > 0 || related.length > 0)) {
    const allIds = [...sameAuthor, ...related]
    const { data: hackRows } = await supabase
      .from("hacks")
      .select(
        "id, title, summary, status, created_at, post_type, primary_tool_slug, estimated_minutes, author_id"
      )
      .in("id", allIds)
      .eq("status", "published")

    const rows = (hackRows ?? []) as HackFeedRow[]
    const savedIds = await loadSavedHackIds(user.id)
    const reactionMap = await loadReactionMap(user.id, allIds)
    const allItems = await buildFeedItems(rows, savedIds, reactionMap)

    const itemMap = new Map(allItems.map((i) => [i.post.id, i]))
    sameAuthorItems = sameAuthor
      .map((hid) => itemMap.get(hid))
      .filter(Boolean) as typeof allItems
    relatedItems = related
      .map((hid) => itemMap.get(hid))
      .filter(Boolean) as typeof allItems
  }

  return (
    <div style={brandStageStyle(brand)} className="min-h-full">
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
        <article
          data-brand={brand.slug}
          className="flex flex-col gap-8 rounded-[2rem] p-6 shadow-sm md:p-10"
          style={{
            backgroundColor: brand.secondary,
            color: brand.onSecondary,
          }}
        >
          <HackDetailHeader
            post={post}
            summary={hack.summary}
            goal={hack.goal}
            tags={tags}
            channels={channels}
          />

          <HackDetailMeta
            createdAt={hack.created_at}
            updatedAt={hack.updated_at}
            likeCount={stats.like_count}
            saveCount={stats.save_count}
            commentCount={stats.comment_count}
          />

          {user ? (
            <HackDetailActions
              hackId={id}
              initialLiked={viewerState.liked}
              initialSaved={viewerState.saved}
              likeCount={stats.like_count}
              saveCount={stats.save_count}
            />
          ) : null}

          <div className="rounded-2xl bg-white/95 p-6 text-zinc-900 md:p-8">
            <HackBody bodyMd={hack.body_md} />
          </div>
        </article>

        <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm md:p-8">
          <HackCommentsSection
            hackId={id}
            hackAuthorId={hack.author_id}
            viewerId={user?.id ?? null}
            initialComments={comments}
            commentCount={stats.comment_count}
          />
        </div>

        {user ? (
          <div className="mt-10">
            <HackRelatedPosts
              sameAuthorItems={sameAuthorItems}
              relatedItems={relatedItems}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
