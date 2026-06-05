import type { Post } from "@/lib/dummy/posts"
import { cn } from "@/lib/utils"

import { BrandLogo } from "./brand-logo"

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
        "font-heading text-center text-2xl leading-snug font-semibold text-balance",
        className
      )}
    >
      <span className="opacity-80">how to </span>
      {action}
      <span className="opacity-80"> in </span>
      <span className="inline-flex items-center justify-center gap-2 align-middle">
        <BrandLogo slug={tool.slug} label={tool.label} />
        <span>{tool.label}</span>
      </span>
    </h2>
  )
}
