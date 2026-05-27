"use client"

import { createContext, useContext } from "react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SuggestChallengeOutput = {
  ok?: boolean
  suggestedTitle?: string
  suggestedBody?: string | null
  tagSlugs?: string[]
  href?: string
}

const AskNavigateContext = createContext<(href: string) => void>(() => {})

export function AskNavigateProvider({
  onNavigate,
  children,
}: {
  onNavigate: (href: string) => void
  children: React.ReactNode
}) {
  return (
    <AskNavigateContext.Provider value={onNavigate}>
      {children}
    </AskNavigateContext.Provider>
  )
}

function SuggestChallengeCard({ output }: { output: unknown }) {
  const onNavigate = useContext(AskNavigateContext)
  const data = output as SuggestChallengeOutput | null
  if (!data?.href) return null

  const title = data.suggestedTitle?.trim() || "Nieuwe challenge"
  const body = data.suggestedBody?.trim()

  return (
    <div className="mt-2 rounded-lg border bg-card p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Challenge voorstel
      </p>
      <p className="mt-1 text-sm font-medium leading-snug">{title}</p>
      {body ? (
        <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{body}</p>
      ) : null}
      <button
        type="button"
        onClick={() => onNavigate(data.href!)}
        className={cn(
          buttonVariants({ size: "sm" }),
          "mt-3 inline-flex w-full sm:w-auto"
        )}
      >
        Maak hier je challenge aan →
      </button>
    </div>
  )
}

/**
 * Custom renderer for the `suggest_challenge` AI tool output. Must be rendered
 * inside `<AskNavigateProvider>` (Ask overlay) so the CTA can animate out first.
 */
export function renderSuggestChallengeOutput(output: unknown) {
  return <SuggestChallengeCard output={output} />
}
