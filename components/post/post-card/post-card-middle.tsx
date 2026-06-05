import type { CSSProperties } from "react"
import Link from "next/link"

import { relativeTime } from "@/lib/format/relative-time"
import type { Post } from "@/lib/dummy/posts"
import { cn } from "@/lib/utils"

import { PostTitle } from "../post-title"

function Divider({
  className,
  style,
}: {
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      className={cn("h-px shrink-0 opacity-30", className)}
      style={{
        backgroundColor: "var(--post-brand-on-secondary-muted)",
        ...style,
      }}
      aria-hidden
    />
  )
}

export function PostCardMiddle({
  post,
  summary,
  href,
}: {
  post: Post
  summary: string | null
  href: string
}) {
  const dateLabel = relativeTime(post.publishedAt)

  return (
    <Link
      href={href}
      className="group/card-link flex flex-col gap-6 px-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
    >
      <PostTitle post={post} className="text-[color:var(--post-brand-on-secondary)]" />

      <Divider className="w-full" />

      {summary ? (
        <div className="w-full">
          <p
            className={cn(
              "text-center text-base leading-relaxed font-normal",
              "text-[color:var(--post-brand-on-secondary)] line-clamp-3"
            )}
          >
            {summary}
          </p>
        </div>
      ) : null}

      <Divider className="w-20 self-center" />

      <p
        className={cn(
          "text-center text-xs",
          "text-[color:var(--post-brand-on-secondary-muted)]"
        )}
      >
        {dateLabel}
        {post.editedAt ? " • Edited" : null}
      </p>
    </Link>
  )
}
