import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PostCard } from "@/components/post/post-card"
import { EmptyStateCard } from "@/components/shell/empty-state"
import { PageHeader, PageShell } from "@/components/shell/page-header"
import { getPostMeta } from "@/lib/dummy/posts"
import { buildPostFromHackRow } from "@/lib/posts/build-post"
import { loadAuthorMap, loadReactionMap } from "@/lib/posts/feed-items"
import { createClient } from "@/lib/supabase/server"

type PageProps = {
  params: Promise<{ id: string }>
}

type HackDetailRow = {
  id: string
  title: string
  summary: string | null
  status: string
  created_at: string
  post_type: string | null
  primary_tool_slug: string | null
  estimated_minutes: number | null
  author_id: string | null
}

async function loadHack(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("hacks")
    .select(
      "id, title, summary, status, created_at, post_type, primary_tool_slug, estimated_minutes, author_id"
    )
    .eq("id", id)
    .maybeSingle<HackDetailRow>()
  return data
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params
  const hack = await loadHack(id)
  if (!hack) return { title: "Post not found" }
  return { title: hack.title }
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createClient()
  const [hack, { data: { user } }] = await Promise.all([
    loadHack(id),
    supabase.auth.getUser(),
  ])

  if (!hack) notFound()

  const meta = getPostMeta(hack.id)

  let saved = false
  let reactions = { helpful: false, notHelpful: false }
  if (user) {
    const [{ data: savedRow }, reactionMap] = await Promise.all([
      supabase
        .from("hack_interactions")
        .select("hack_id")
        .eq("user_id", user.id)
        .eq("hack_id", hack.id)
        .eq("kind", "saved")
        .maybeSingle(),
      loadReactionMap(user.id, [hack.id]),
    ])
    saved = Boolean(savedRow)
    reactions = reactionMap.get(hack.id) ?? reactions
  }

  let post
  if (meta) {
    post = { id: hack.id, ...meta }
  } else {
    const authorMap = await loadAuthorMap(
      hack.author_id ? [hack.author_id] : []
    )
    post = buildPostFromHackRow(
      hack,
      authorMap.get(hack.author_id ?? "") ?? null
    )
  }

  return (
    <PageShell>
      <PageHeader title={hack.title} />

      <PostCard
        post={post}
        summary={hack.summary}
        saved={saved}
        reactions={reactions}
      />

      <EmptyStateCard
        title="Detail page komt later"
        description="De volledige post-pagina (markdown body, comments, praise, complete-flow) volgt in een latere sprint."
      />
    </PageShell>
  )
}
