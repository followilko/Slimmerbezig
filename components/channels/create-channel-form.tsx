"use client"

import { Hash } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"

import { createChannel } from "@/app/(app)/channels/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export type ExistingChannel = {
  slug: string
  name: string
  description: string | null
}

export function CreateChannelForm({
  existing,
}: {
  existing: ExistingChannel[]
}) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [duplicateSlug, setDuplicateSlug] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const query = name.trim().toLowerCase()
  const suggestions = useMemo(() => {
    if (query.length < 2) return []
    return existing
      .filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.description ?? "").toLowerCase().includes(query)
      )
      .slice(0, 4)
  }, [existing, query])

  const duplicate = duplicateSlug
    ? existing.find((c) => c.slug === duplicateSlug)
    : null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setDuplicateSlug(null)
    if (name.trim().length < 3) {
      toast.error("Geef een naam van minstens 3 tekens.")
      return
    }
    startTransition(async () => {
      const res = await createChannel({ name, description })
      if (res.ok) {
        toast.success("Kanaal aangemaakt — +100 XP!")
        router.push(`/channels/${res.slug}`)
        return
      }
      if (res.reason === "duplicate") {
        setDuplicateSlug(res.existingSlug)
        return
      }
      if (res.reason === "not_allowed") {
        toast.error("Je hebt nog niet het juiste level om kanalen te maken.")
        return
      }
      if (res.reason === "name_required") {
        toast.error("Geef een geldige naam op.")
        return
      }
      toast.error("Aanmaken lukte niet. Probeer opnieuw.")
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="channel-name">Naam</Label>
        <Input
          id="channel-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Bijv. Marketing Automation"
          maxLength={60}
          autoComplete="off"
        />
      </div>

      {suggestions.length > 0 ? (
        <div className="rounded-xl border border-border bg-muted/40 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Bestaat dit al? Word liever lid van een bestaand kanaal:
          </p>
          <ul className="space-y-1">
            {suggestions.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/channels/${c.slug}`}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-background"
                >
                  <Hash className="size-3.5 text-muted-foreground" />
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="channel-description">Omschrijving</Label>
        <Textarea
          id="channel-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Waar gaat dit kanaal over? Wie is het voor?"
          rows={4}
          maxLength={280}
        />
      </div>

      {duplicate ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Er bestaat al een vergelijkbaar kanaal:{" "}
          <Link
            href={`/channels/${duplicate.slug}`}
            className="font-semibold underline"
          >
            {duplicate.name}
          </Link>
          . Word daar lid in plaats van een dubbel kanaal te maken.
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Je verdient <span className="font-semibold">+100 XP</span> als je een
          kanaal aanmaakt.
        </p>
        <Button type="submit" disabled={pending}>
          Kanaal aanmaken
        </Button>
      </div>
    </form>
  )
}
