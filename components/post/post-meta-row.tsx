import { Badge } from "@/components/ui/badge"
import { POST_TYPE_LABEL, type Post } from "@/lib/dummy/posts"

import { PostFavoriteButton } from "./post-favorite-button"

export function PostMetaRow({
  post,
  saved,
}: {
  post: Post
  saved: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline">{POST_TYPE_LABEL[post.postType]}</Badge>
        <Badge variant="secondary">{post.estimatedMinutes} min</Badge>
      </div>
      <PostFavoriteButton postId={post.id} saved={saved} />
    </div>
  )
}
