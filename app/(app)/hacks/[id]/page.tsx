import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PostAuthor } from "@/components/post/post-author"
import { PostMetaRow } from "@/components/post/post-meta-row"
import { PostSocialRow } from "@/components/post/post-social-row"
import { PostTitle } from "@/components/post/post-title"
import { EmptyStateCard } from "@/components/shell/empty-state"
import { PageHeader, PageShell } from "@/components/shell/page-header"
import { getPostMeta } from "@/lib/dummy/posts"
import { createClient } from "@/lib/supabase/server"

type PageProps = {
  params: Promise<{ id: string }>
}

async function loadHack(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("hacks")
    .select("id, title, status")
    .eq("id", id)
    .maybeSingle<{ id: string; title: string; status: string }>()
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
  const [{ data: hack }, { data: { user } }] = await Promise.all([
    supabase
      .from("hacks")
      .select("id, title, status")
      .eq("id", id)
      .maybeSingle<{ id: string; title: string; status: string }>(),
    supabase.auth.getUser(),
  ])

  if (!hack) notFound()

  const meta = getPostMeta(hack.id)
  if (!meta) notFound()

  let saved = false
  if (user) {
    const { data: savedRow } = await supabase
      .from("hack_interactions")
      .select("hack_id")
      .eq("user_id", user.id)
      .eq("hack_id", hack.id)
      .eq("kind", "saved")
      .maybeSingle()
    saved = Boolean(savedRow)
  }

  const post = { id: hack.id, ...meta }

  return (
    <PageShell className="max-w-3xl">
      <PageHeader title={hack.title} />

      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <PostMetaRow post={post} saved={saved} />
        <div className="mt-4 space-y-4">
          <PostTitle post={post} />
          <PostAuthor post={post} />
          <PostSocialRow metrics={post.metrics} />
        </div>
      </div>

      <EmptyStateCard
        title="Detail page komt later"
        description="De volledige post-pagina (markdown body, comments, praise, complete-flow) volgt in een latere sprint. Voor nu kun je de kaart-layout en dummy-data valideren."
      />
    </PageShell>
  )
}
