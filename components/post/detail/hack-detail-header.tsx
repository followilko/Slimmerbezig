import Link from "next/link"

import { PostTitle } from "@/components/post/post-title"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { POST_TYPE_LABEL, type Post } from "@/lib/dummy/posts"
import { goalLabel } from "@/lib/posts/goal-labels"
import type { HackChannel, HackTag } from "@/lib/posts/hack-detail"
import { cn } from "@/lib/utils"

function initialsFor(name: string): string {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  )
}

export function HackDetailHeader({
  post,
  summary,
  goal,
  tags,
  channels,
  className,
}: {
  post: Post
  summary: string | null
  goal: string | null
  tags: HackTag[]
  channels: HackChannel[]
  className?: string
}) {
  const goalText = goalLabel(goal)
  const toolTags = tags.filter((t) => t.kind === "tool")
  const capabilityTags = tags.filter((t) => t.kind === "capability")
  const otherTags = tags.filter(
    (t) => t.kind !== "tool" && t.kind !== "capability"
  )

  return (
    <header className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span
          className="inline-flex h-7 items-center rounded-full px-3 text-xs font-medium"
          style={{
            backgroundColor: "var(--post-brand-primary)",
            color: "var(--post-brand-on-primary)",
          }}
        >
          {POST_TYPE_LABEL[post.postType]}
        </span>
        {post.estimatedMinutes > 0 ? (
          <span className="inline-flex h-7 items-center rounded-full bg-white/90 px-3 text-xs font-medium text-zinc-900">
            {post.estimatedMinutes} min
          </span>
        ) : null}
        {goalText ? (
          <span className="inline-flex h-7 items-center rounded-full bg-white/70 px-3 text-xs font-medium text-zinc-800">
            {goalText}
          </span>
        ) : null}
      </div>

      <PostTitle
        post={post}
        className="text-3xl md:text-4xl text-[color:var(--post-brand-on-secondary)]"
      />

      {summary ? (
        <p className="mx-auto max-w-2xl text-center text-lg leading-relaxed text-[color:var(--post-brand-on-secondary-muted)]">
          {summary}
        </p>
      ) : null}

      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-10 ring-2 ring-white/80">
            {post.author.avatarUrl ? (
              <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
            ) : null}
            <AvatarFallback className="text-xs">
              {initialsFor(post.author.name)}
            </AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="text-sm font-semibold text-[color:var(--post-brand-on-secondary)]">
              {post.author.name}
            </p>
            {post.author.role ? (
              <p className="text-xs text-[color:var(--post-brand-on-secondary-muted)]">
                {post.author.role}
              </p>
            ) : null}
          </div>
        </div>

        {(toolTags.length > 0 ||
          capabilityTags.length > 0 ||
          otherTags.length > 0 ||
          channels.length > 0) && (
          <div className="flex max-w-2xl flex-wrap justify-center gap-2">
            {toolTags.map((t) => (
              <Chip key={t.slug} label={t.label} variant="tool" />
            ))}
            {capabilityTags.map((t) => (
              <Chip key={t.slug} label={t.label} variant="muted" />
            ))}
            {otherTags.map((t) => (
              <Chip key={t.slug} label={t.label} variant="muted" />
            ))}
            {channels.map((c) => (
              <Link
                key={c.id}
                href={`/channels/${c.slug}`}
                className="inline-flex h-7 items-center rounded-full border border-white/30 bg-white/20 px-3 text-xs font-medium text-[color:var(--post-brand-on-secondary)] transition-colors hover:bg-white/30"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}

function Chip({
  label,
  variant,
}: {
  label: string
  variant: "tool" | "muted"
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-3 text-xs font-medium",
        variant === "tool"
          ? "bg-white/90 text-zinc-900"
          : "bg-white/20 text-[color:var(--post-brand-on-secondary)]"
      )}
    >
      {label}
    </span>
  )
}
