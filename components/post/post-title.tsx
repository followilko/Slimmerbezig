import type { Post } from "@/lib/dummy/posts"
import { cn } from "@/lib/utils"

import { ToolIcon } from "./tool-icon"

export function PostTitle({
  post,
  className,
}: {
  post: Pick<Post, "title">
  className?: string
}) {
  const { action, tool } = post.title

  return (
    <h2
      className={cn(
        "font-heading text-center text-base leading-snug font-medium text-balance",
        className
      )}
    >
      <span className="text-muted-foreground">how to </span>
      {action}
      <span className="text-muted-foreground"> in </span>
      <span className="inline-flex items-center gap-1 align-middle">
        <ToolIcon slug={tool.slug} size="sm" />
        <span>{tool.label}</span>
      </span>
    </h2>
  )
}
