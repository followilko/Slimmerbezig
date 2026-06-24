"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowUpDown, MoreHorizontal, Trash2 } from "lucide-react"

import {
  addComment,
  deleteComment,
  toggleCommentLike,
} from "@/app/(app)/hacks/[id]/actions"
import { IconHeart } from "@/components/icons/post-card/icon-heart"
import { IconHeartFilled } from "@/components/icons/post-card/icon-heart-filled"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { relativeTime } from "@/lib/format/relative-time"
import type { HackCommentRow } from "@/lib/posts/hack-detail"
import { cn } from "@/lib/utils"

type SortMode = "newest" | "most_liked"

function initialsFor(name: string): string {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  )
}

function authorName(author: HackCommentRow["author"]): string {
  if (!author) return "Collega"
  const full = author.full_name?.trim()
  if (full) return full
  const combined = [author.given_name, author.family_name]
    .filter(Boolean)
    .join(" ")
    .trim()
  return combined || "Collega"
}

export function HackCommentsSection({
  hackId,
  hackAuthorId,
  viewerId,
  initialComments,
  commentCount,
}: {
  hackId: string
  hackAuthorId: string | null
  viewerId: string | null
  initialComments: HackCommentRow[]
  commentCount: number
}) {
  const router = useRouter()
  const [sort, setSort] = useState<SortMode>("newest")
  const [comments, setComments] = useState(initialComments)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [, startRefresh] = useTransition()

  const sorted = useMemo(() => {
    const copy = [...comments]
    if (sort === "most_liked") {
      copy.sort((a, b) => b.like_count - a.like_count || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else {
      copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
    return copy
  }, [comments, sort])

  const topLevel = sorted.filter((c) => !c.parent_comment_id)
  const repliesByParent = useMemo(() => {
    const map = new Map<string, HackCommentRow[]>()
    for (const c of sorted) {
      if (!c.parent_comment_id) continue
      const list = map.get(c.parent_comment_id) ?? []
      list.push(c)
      map.set(c.parent_comment_id, list)
    }
    return map
  }, [sorted])

  function refreshComments() {
    startRefresh(() => {
      router.refresh()
    })
  }

  async function handleSubmit(body: string, isTip: boolean, parentId: string | null) {
    const result = await addComment({
      hackId,
      bodyMd: body,
      isTip,
      parentCommentId: parentId,
    })
    if (result.ok) {
      setReplyTo(null)
      refreshComments()
    }
  }

  async function handleDelete(commentId: string) {
    const result = await deleteComment(commentId, hackId)
    if (result.ok) {
      setComments((prev) =>
        prev.filter((c) => c.id !== commentId && c.parent_comment_id !== commentId)
      )
    }
  }

  async function handleLike(commentId: string) {
    const result = await toggleCommentLike(commentId, hackId)
    if (result.ok) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                liked_by_viewer: result.liked ?? false,
                like_count: c.like_count + (result.liked ? 1 : -1),
              }
            : c
        )
      )
    }
  }

  return (
    <section id="comments" className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">
          {commentCount} reactie{commentCount === 1 ? "" : "s"}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() =>
            setSort((s) => (s === "newest" ? "most_liked" : "newest"))
          }
        >
          <ArrowUpDown className="size-4" />
          {sort === "newest" ? "Nieuwste" : "Meest geliked"}
        </Button>
      </div>

      {viewerId ? (
        <CommentComposer
          placeholder="Discussieer mee..."
          onSubmit={(body, isTip) => handleSubmit(body, isTip, replyTo)}
          onCancel={replyTo ? () => setReplyTo(null) : undefined}
          replyLabel={
            replyTo
              ? `Antwoord op ${authorName(comments.find((c) => c.id === replyTo)?.author ?? null)}`
              : undefined
          }
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Log in om mee te discussiëren.
        </p>
      )}

      <div className="flex flex-col gap-6">
        {topLevel.map((comment) => (
          <CommentThread
            key={comment.id}
            comment={comment}
            replies={repliesByParent.get(comment.id) ?? []}
            hackAuthorId={hackAuthorId}
            viewerId={viewerId}
            collapsed={collapsed.has(comment.id)}
            onToggleCollapse={() =>
              setCollapsed((prev) => {
                const next = new Set(prev)
                if (next.has(comment.id)) next.delete(comment.id)
                else next.add(comment.id)
                return next
              })
            }
            onReply={() => setReplyTo(comment.id)}
            onDelete={() => handleDelete(comment.id)}
            onLike={() => handleLike(comment.id)}
            onReplyDelete={handleDelete}
            onReplyLike={handleLike}
          />
        ))}
      </div>
    </section>
  )
}

function CommentComposer({
  placeholder,
  onSubmit,
  onCancel,
  replyLabel,
}: {
  placeholder: string
  onSubmit: (body: string, isTip: boolean) => void | Promise<void>
  onCancel?: () => void
  replyLabel?: string
}) {
  const [body, setBody] = useState("")
  const [isTip, setIsTip] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleSubmit() {
    if (!body.trim()) return
    setPending(true)
    try {
      await onSubmit(body.trim(), isTip)
      setBody("")
      setIsTip(false)
      onCancel?.()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4">
      {replyLabel ? (
        <p className="text-xs text-muted-foreground">{replyLabel}</p>
      ) : null}
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        className="min-h-20 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        {!replyLabel ? (
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isTip}
              onChange={(e) => setIsTip(e.target.checked)}
              className="size-4 rounded border-border"
            />
            <span>Markeer als verbetertip</span>
          </label>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          {onCancel ? (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Annuleren
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            disabled={pending || !body.trim()}
            onClick={handleSubmit}
          >
            Plaatsen
          </Button>
        </div>
      </div>
    </div>
  )
}

function CommentThread({
  comment,
  replies,
  hackAuthorId,
  viewerId,
  collapsed,
  onToggleCollapse,
  onReply,
  onDelete,
  onLike,
  onReplyDelete,
  onReplyLike,
}: {
  comment: HackCommentRow
  replies: HackCommentRow[]
  hackAuthorId: string | null
  viewerId: string | null
  collapsed: boolean
  onToggleCollapse: () => void
  onReply: () => void
  onDelete: () => void
  onLike: () => void
  onReplyDelete: (id: string) => void
  onReplyLike: (id: string) => void
}) {
  const name = authorName(comment.author)
  const isHackAuthor = hackAuthorId === comment.author_id
  const canDelete = viewerId === comment.author_id

  return (
    <article
      className={cn(
        "flex flex-col gap-4",
        comment.is_tip &&
          "rounded-2xl border border-amber-200 bg-amber-50/50 p-4"
      )}
    >
      <CommentRow
        comment={comment}
        name={name}
        isHackAuthor={isHackAuthor}
        isTip={comment.is_tip}
        canDelete={canDelete}
        onReply={onReply}
        onDelete={onDelete}
        onLike={onLike}
      />

      {!collapsed && replies.length > 0 ? (
        <div className="ml-6 flex flex-col gap-4 border-l border-border pl-4">
          {replies.map((reply) => (
            <CommentRow
              key={reply.id}
              comment={reply}
              name={authorName(reply.author)}
              isHackAuthor={hackAuthorId === reply.author_id}
              isTip={false}
              canDelete={viewerId === reply.author_id}
              onReply={onReply}
              onDelete={() => onReplyDelete(reply.id)}
              onLike={() => onReplyLike(reply.id)}
              isReply
            />
          ))}
        </div>
      ) : null}

      {replies.length > 0 ? (
        <button
          type="button"
          onClick={onToggleCollapse}
          className="ml-12 text-left text-sm text-blue-600 underline-offset-2 hover:underline"
        >
          {collapsed
            ? `${replies.length} antwoord${replies.length === 1 ? "" : "en"} tonen`
            : "Antwoorden samenvouwen"}
        </button>
      ) : null}
    </article>
  )
}

function CommentRow({
  comment,
  name,
  isHackAuthor,
  isTip,
  canDelete,
  onReply,
  onDelete,
  onLike,
  isReply = false,
}: {
  comment: HackCommentRow
  name: string
  isHackAuthor: boolean
  isTip: boolean
  canDelete: boolean
  onReply: () => void
  onDelete: () => void
  onLike: () => void
  isReply?: boolean
}) {
  const avatarUrl = comment.author?.avatar_url

  return (
    <div className="flex gap-3">
      <Avatar className={cn("shrink-0", isReply ? "size-8" : "size-10")}>
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
        <AvatarFallback className="text-xs">{initialsFor(name)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{name}</span>
          {isHackAuthor ? (
            <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-700">
              Auteur
            </span>
          ) : null}
          {isTip ? (
            <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
              Verbetertip
            </span>
          ) : null}
          <span className="text-xs text-muted-foreground">
            {relativeTime(comment.created_at)}
          </span>
        </div>

        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
          {comment.body_md}
        </p>

        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={onLike}
            className={cn(
              "inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground",
              comment.liked_by_viewer && "text-favorite"
            )}
          >
            {comment.liked_by_viewer ? (
              <IconHeartFilled className="size-4" />
            ) : (
              <IconHeart className="size-4" />
            )}
            {comment.like_count > 0 ? (
              <span className="tabular-nums">{comment.like_count}</span>
            ) : null}
          </button>

          {!isReply ? (
            <button
              type="button"
              onClick={onReply}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Antwoorden
            </button>
          ) : null}

          {canDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-red-600"
              aria-label="Verwijderen"
            >
              <Trash2 className="size-3.5" />
            </button>
          ) : (
            <button
              type="button"
              className="text-muted-foreground"
              aria-label="Meer opties"
              disabled
            >
              <MoreHorizontal className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
