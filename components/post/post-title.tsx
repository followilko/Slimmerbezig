import type { Post, ToolSlug } from "@/lib/dummy/posts"
import { detectToolInTitle } from "@/lib/posts/build-post"
import { cn } from "@/lib/utils"

import { BrandLogo } from "./brand-logo"

const HEADING_CLASS =
  "font-heading text-center text-2xl leading-snug font-semibold text-balance"

/** Inline tool chip (icon + label) rendered mid-sentence in a free-form title. */
function ToolChip({ slug, label }: { slug: ToolSlug; label: string }) {
  return (
    <span className="inline-flex items-center justify-center gap-1.5 align-middle">
      <BrandLogo slug={slug} label={label} className="size-6" />
      <span>{label}</span>
    </span>
  )
}

export function PostTitle({
  post,
  className,
}: {
  post: Pick<Post, "title">
  className?: string
}) {
  const { action, tool, text } = post.title

  // Free-form (user-authored) title: render verbatim, with an inline brand icon
  // where a known tool name is recognised.
  if (text?.trim()) {
    const value = text.trim()
    const detected = detectToolInTitle(value)
    return (
      <h2 className={cn(HEADING_CLASS, className)}>
        {detected ? (
          <>
            {value.slice(0, detected.start)}
            <ToolChip slug={detected.slug} label={value.slice(detected.start, detected.end)} />
            {value.slice(detected.end)}
          </>
        ) : (
          <>
            {value}
            {tool ? (
              <>
                {" "}
                <ToolChip slug={tool.slug} label={tool.label} />
              </>
            ) : null}
          </>
        )}
      </h2>
    )
  }

  // Legacy/seeded structured title.
  return (
    <h2 className={cn(HEADING_CLASS, className)}>
      <span className="opacity-80">how to </span>
      {action}
      {tool ? (
        <>
          <span className="opacity-80"> in </span>
          <span className="inline-flex items-center justify-center gap-2 align-middle">
            <BrandLogo slug={tool.slug} label={tool.label} />
            <span>{tool.label}</span>
          </span>
        </>
      ) : null}
    </h2>
  )
}
