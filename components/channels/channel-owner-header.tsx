"use client"

import { Hash, Pencil } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { updateChannel } from "@/app/(app)/channels/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function ChannelOwnerHeader({
  slug,
  name: initialName,
  description: initialDescription,
  memberCount,
  hackCount,
  challengeCount,
}: {
  slug: string
  name: string
  description: string | null
  memberCount: number
  hackCount: number
  challengeCount: number
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription ?? "")
  const [duplicateSlug, setDuplicateSlug] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleCancel() {
    setName(initialName)
    setDescription(initialDescription ?? "")
    setDuplicateSlug(null)
    setEditing(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setDuplicateSlug(null)
    if (name.trim().length < 3) {
      toast.error("Geef een naam van minstens 3 tekens.")
      return
    }
    startTransition(async () => {
      const res = await updateChannel({ slug, name, description })
      if (res.ok) {
        toast.success("Kanaal bijgewerkt")
        setEditing(false)
        router.refresh()
        return
      }
      if (res.reason === "duplicate") {
        setDuplicateSlug(res.existingSlug)
        return
      }
      if (res.reason === "not_allowed") {
        toast.error("Je mag dit kanaal niet bewerken.")
        return
      }
      toast.error("Opslaan lukte niet. Probeer opnieuw.")
    })
  }

  if (!editing) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-start gap-2">
          <h1 className="font-heading flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Hash className="size-6 text-muted-foreground" />
            {initialName}
          </h1>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-muted-foreground"
            onClick={() => setEditing(true)}
          >
            <Pencil className="size-3.5" />
            Bewerken
          </Button>
        </div>
        {initialDescription ? (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {initialDescription}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {memberCount} leden &middot; {hackCount} hacks &middot;{" "}
          {challengeCount} challenges
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-channel-name">Naam</Label>
        <Input
          id="edit-channel-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          autoComplete="off"
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-channel-description">Omschrijving</Label>
        <Textarea
          id="edit-channel-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={280}
          disabled={pending}
        />
      </div>

      {duplicateSlug ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Er bestaat al een kanaal met deze naam:{" "}
          <Link
            href={`/channels/${duplicateSlug}`}
            className="font-semibold underline"
          >
            bekijk kanaal
          </Link>
          .
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          Opslaan
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={pending}
        >
          Annuleren
        </Button>
      </div>
    </form>
  )
}
