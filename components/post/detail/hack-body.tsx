"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeSanitize from "rehype-sanitize"

import { cn } from "@/lib/utils"

export function HackBody({
  bodyMd,
  className,
}: {
  bodyMd: string
  className?: string
}) {
  if (!bodyMd.trim()) return null

  return (
    <div
      className={cn(
        "prose prose-zinc max-w-none",
        "prose-headings:font-heading prose-headings:font-semibold",
        "prose-a:text-[color:var(--post-brand-primary)] prose-a:no-underline hover:prose-a:underline",
        "prose-code:rounded prose-code:bg-black/5 prose-code:px-1 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          pre({ children, ...props }) {
            return (
              <div className="not-prose my-6 overflow-hidden rounded-2xl border border-black/10 bg-zinc-950 shadow-sm">
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-medium text-zinc-400">
                    AI-snippet
                  </span>
                </div>
                <pre
                  {...props}
                  className="overflow-x-auto p-4 text-sm leading-relaxed text-zinc-100"
                >
                  {children}
                </pre>
              </div>
            )
          },
          code({ className: codeClass, children, ...props }) {
            const isBlock = Boolean(codeClass?.includes("language-"))
            if (isBlock) {
              return (
                <code className={codeClass} {...props}>
                  {children}
                </code>
              )
            }
            return (
              <code className={codeClass} {...props}>
                {children}
              </code>
            )
          },
        }}
      >
        {bodyMd}
      </ReactMarkdown>
    </div>
  )
}
