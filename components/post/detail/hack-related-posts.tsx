import { PostCard } from "@/components/post/post-card"
import type { FeedPostItem } from "@/lib/posts/feed-items"

export function HackRelatedPosts({
  sameAuthorItems,
  relatedItems,
}: {
  sameAuthorItems: FeedPostItem[]
  relatedItems: FeedPostItem[]
}) {
  if (sameAuthorItems.length === 0 && relatedItems.length === 0) return null

  return (
    <div className="flex flex-col gap-10 border-t border-border pt-10">
      {sameAuthorItems.length > 0 ? (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Van dezelfde auteur</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sameAuthorItems.map((item) => (
              <PostCard
                key={item.post.id}
                post={item.post}
                summary={item.summary}
                saved={item.saved}
                reactions={item.reactions}
              />
            ))}
          </div>
        </section>
      ) : null}

      {relatedItems.length > 0 ? (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Gerelateerd</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedItems.map((item) => (
              <PostCard
                key={item.post.id}
                post={item.post}
                summary={item.summary}
                saved={item.saved}
                reactions={item.reactions}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
