import { relativeTime } from "@/lib/format/relative-time"
import { cn } from "@/lib/utils"

export function HackDetailMeta({
  createdAt,
  updatedAt,
  likeCount,
  saveCount,
  commentCount,
  className,
}: {
  createdAt: string
  updatedAt: string
  likeCount: number
  saveCount: number
  commentCount: number
  className?: string
}) {
  const edited =
    updatedAt &&
    createdAt &&
    new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 60_000

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-zinc-500",
        className
      )}
    >
      <span>{relativeTime(createdAt)}</span>
      {edited ? <span>Bewerkt {relativeTime(updatedAt)}</span> : null}
      <span aria-hidden>·</span>
      <span>{likeCount} likes</span>
      <span>{saveCount} opgeslagen</span>
      <span>{commentCount} reacties</span>
    </div>
  )
}
