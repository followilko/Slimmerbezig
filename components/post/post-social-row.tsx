import { Flame, MessageCircle, Send, ThumbsUp } from "lucide-react"

import type { Post } from "@/lib/dummy/posts"
import { cn } from "@/lib/utils"

function SocialMetric({
  icon: Icon,
  count,
  label,
}: {
  icon: typeof ThumbsUp
  count?: number
  label: string
}) {
  return (
    <span
      className="inline-flex items-center gap-1 text-muted-foreground"
      aria-label={label}
    >
      <Icon className="size-4" aria-hidden />
      {count != null ? (
        <span className="text-xs font-medium tabular-nums">{count}</span>
      ) : null}
    </span>
  )
}

export function PostSocialRow({
  metrics,
  className,
}: {
  metrics: Post["metrics"]
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2.5",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <SocialMetric
          icon={ThumbsUp}
          count={metrics.likes}
          label={`${metrics.likes} likes`}
        />
        <SocialMetric
          icon={MessageCircle}
          count={metrics.comments}
          label={`${metrics.comments} comments`}
        />
        <SocialMetric icon={Send} label="Share" />
      </div>
      <span className="inline-flex items-center gap-1 rounded-full bg-points px-2.5 py-1 text-xs font-semibold text-points-foreground ring-1 ring-border/60">
        <Flame className="size-3.5 text-points-foreground" aria-hidden />
        <span className="tabular-nums">{metrics.points}</span>
      </span>
    </div>
  )
}
