import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PostAuthor } from "@/components/post/post-author"
import { PostMetaRow } from "@/components/post/post-meta-row"
import { PostSocialRow } from "@/components/post/post-social-row"
import { PostTitle } from "@/components/post/post-title"
import { EmptyStateCard } from "@/components/shell/empty-state"
import { PageHeader, PageShell } from "@/components/shell/page-header"
import { formatPostTitle, getPostById } from "@/lib/dummy/posts"
import { isPostSaved } from "@/lib/posts/saved-posts-cookie"

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params
  const post = getPostById(id)
  if (!post) return { title: "Post not found" }
  return { title: formatPostTitle(post) }
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params
  const post = getPostById(id)
  if (!post) notFound()

  const saved = await isPostSaved(id)

  return (
    <PageShell className="max-w-3xl">
      <PageHeader title={formatPostTitle(post)} />

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
