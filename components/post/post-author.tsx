import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { relativeTime } from "@/lib/format/relative-time"
import type { Post } from "@/lib/dummy/posts"

function initialsFor(name: string): string {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  )
}

export function PostAuthor({ post }: { post: Post }) {
  const { author, publishedAt, editedAt } = post
  const dateLabel = relativeTime(publishedAt)

  return (
    <div className="flex items-start justify-between gap-3 border-t pt-4">
      <div className="flex min-w-0 items-start gap-2.5">
        <Avatar size="sm" className="mt-0.5">
          {author.avatarUrl ? (
            <AvatarImage src={author.avatarUrl} alt={author.name} />
          ) : null}
          <AvatarFallback>{initialsFor(author.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-sm font-semibold">{author.name}</p>
          <p className="text-muted-foreground truncate text-xs">
            {author.role}
            {" @ "}
            {author.organizationHref ? (
              <Link
                href={author.organizationHref}
                className="underline decoration-border underline-offset-2 hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                {author.organization}
              </Link>
            ) : (
              <span className="underline decoration-border underline-offset-2">
                {author.organization}
              </span>
            )}
          </p>
        </div>
      </div>
      <p className="text-muted-foreground shrink-0 text-xs whitespace-nowrap">
        {dateLabel}
        {editedAt ? " • Edited" : null}
      </p>
    </div>
  )
}
