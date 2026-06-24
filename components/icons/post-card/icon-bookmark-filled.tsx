import { PostCardSvg } from "./post-card-svg"

/** Filled bookmark for active save state. */
export function IconBookmarkFilled({ className }: { className?: string }) {
  return (
    <PostCardSvg className={className} fill="currentColor">
      <path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-3.5L6 22V4z" />
    </PostCardSvg>
  )
}
