import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { POST_TYPE_LABEL, type Post } from "@/lib/dummy/posts"

import { PostFavoriteButton } from "../post-favorite-button"

function initialsFor(name: string): string {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  )
}

export function PostCardTop({
  post,
  saved,
}: {
  post: Post
  saved: boolean
}) {
  const { author } = post

  return (
    <div className="flex items-center justify-between gap-2">
      <Avatar className="size-12 shrink-0 ring-2 ring-white/80">
        {author.avatarUrl ? (
          <AvatarImage src={author.avatarUrl} alt={author.name} />
        ) : null}
        <AvatarFallback className="text-xs">
          {initialsFor(author.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
        <span
          className="inline-flex h-[1.75rem] items-center rounded-full px-3 text-xs font-medium"
          style={{
            backgroundColor: "var(--post-brand-primary)",
            color: "var(--post-brand-on-primary)",
          }}
        >
          {POST_TYPE_LABEL[post.postType]}
        </span>
        <span className="inline-flex h-[1.75rem] items-center rounded-full bg-white/90 px-3 text-xs font-medium text-zinc-900">
          {post.estimatedMinutes} min
        </span>
      </div>

      <PostFavoriteButton
        postId={post.id}
        saved={saved}
        className="size-12 shrink-0"
      />
    </div>
  )
}
