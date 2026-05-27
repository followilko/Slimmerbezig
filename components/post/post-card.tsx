import Link from "next/link"

import { HackViewTracker } from "@/components/feed/hack-view-tracker"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import type { Post } from "@/lib/dummy/posts"
import { cn } from "@/lib/utils"

import { PostAuthor } from "./post-author"
import { PostMetaRow } from "./post-meta-row"
import { PostPeerFooter } from "./post-peer-footer"
import { PostSocialRow } from "./post-social-row"
import { PostTitle } from "./post-title"

export function PostCard({
  post,
  saved,
  className,
  enableViewTracking = false,
  alreadyViewed = false,
}: {
  post: Post
  saved: boolean
  className?: string
  /** Only enable when post.id maps to a real hacks row (FK-safe). */
  enableViewTracking?: boolean
  alreadyViewed?: boolean
}) {
  return (
    <Card
      className={cn(
        "relative h-full shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      {enableViewTracking ? (
        <HackViewTracker hackId={post.id} alreadyViewed={alreadyViewed} />
      ) : null}

      <Link
        href={`/hacks/${post.id}`}
        className="group/card-link flex h-full flex-col focus-visible:outline-none"
      >
        <CardHeader className="pb-2">
          <PostMetaRow post={post} saved={saved} />
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4">
          <PostTitle post={post} />
          <PostAuthor post={post} />
          <PostSocialRow metrics={post.metrics} />
          <PostPeerFooter post={post} />
        </CardContent>
      </Link>
    </Card>
  )
}
