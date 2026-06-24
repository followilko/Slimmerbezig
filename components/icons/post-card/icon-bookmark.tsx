import { PostCardSvg } from "./post-card-svg"

/** Bookmark outline for save/favorite affordance. */
export function IconBookmark({ className }: { className?: string }) {
  return (
    <PostCardSvg className={className}>
      <path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-3.5L6 22V4z" />
    </PostCardSvg>
  )
}
