"use client"

import { useActionState, useMemo, useState } from "react"

import {
  createChallenge,
  type CreateChallengeState,
} from "@/app/(app)/challenges/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export type ChallengeTagOption = {
  slug: string
  label: string
  kind: string
}

const initialState: CreateChallengeState = { ok: true }

export function NewChallengeForm({
  defaultTitle = "",
  defaultBody = "",
  defaultTagSlugs = [],
  tags,
}: {
  defaultTitle?: string
  defaultBody?: string
  defaultTagSlugs?: string[]
  tags: ChallengeTagOption[]
}) {
  const [state, formAction, pending] = useActionState(
    createChallenge,
    initialState
  )
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(defaultTagSlugs)

  const tagSlugsValue = useMemo(() => selectedSlugs.join(","), [selectedSlugs])

  function toggleTag(slug: string) {
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  return (
    <form action={formAction} className="mx-auto max-w-xl space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Titel</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={120}
          defaultValue={defaultTitle}
          placeholder="Waar heb je hulp bij nodig?"
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Beschrijving (optioneel)</Label>
        <textarea
          id="body"
          name="body"
          maxLength={2000}
          rows={5}
          defaultValue={defaultBody}
          placeholder="Geef wat context — welke tools, wat heb je al geprobeerd?"
          disabled={pending}
          className={cn(
            "flex w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          )}
        />
      </div>

      {tags.length > 0 ? (
        <div className="space-y-2">
          <Label>Tags (optioneel)</Label>
          <input type="hidden" name="tagSlugs" value={tagSlugsValue} />
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const active = selectedSlugs.includes(tag.slug)
              return (
                <button
                  key={tag.slug}
                  type="button"
                  onClick={() => toggleTag(tag.slug)}
                  disabled={pending}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-foreground/30"
                  )}
                >
                  {tag.label}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {state.ok === false && state.reason ? (
        <p className="text-sm text-destructive" role="alert">
          {state.reason}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Bezig…" : "Plaats challenge"}
        </Button>
      </div>
    </form>
  )
}
