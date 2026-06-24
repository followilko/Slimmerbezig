"use client"

import { Loader2, Sparkles, X, ImagePlus } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { publishHack } from "@/app/(app)/hacks/actions"
import { PostCard } from "@/components/post/post-card"
import { COMPOSE_HACK, COMPOSE_PARAM } from "@/components/post/post-maker/compose-param"
import {
  downscaleScreenshot,
  isImageFile,
} from "@/components/post/post-maker/downscale-screenshot"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { HackDraft } from "@/lib/ai/hack-draft"
import { MAX_SCREENSHOTS } from "@/lib/ai/hack-draft"
import { POST_TYPE_LABEL, type PostType } from "@/lib/dummy/posts"
import {
  buildPostFromDraft,
  composeDefaultTitle,
  detectToolInTitle,
} from "@/lib/posts/build-post"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const EDITABLE_POST_TYPES: PostType[] = ["bite", "recipe", "guide"]

type Channel = { id: string; slug: string; name: string }

type ScreenshotItem = { id: string; dataUrl: string; name: string }

const GENERATE_ERRORS: Record<string, string> = {
  url_required: "Vul een publieke link in.",
  conversation_too_short: "Plak een wat langer gesprek (min. 20 tekens).",
  screenshot_required: "Upload minimaal één screenshot.",
  too_many_screenshots: `Maximaal ${MAX_SCREENSHOTS} screenshots per keer.`,
  screenshot_invalid: "Ongeldige afbeelding. Gebruik PNG, JPEG of WebP.",
  invalid_url: "Dit lijkt geen geldige URL.",
  url_must_be_https: "Alleen https-links worden ondersteund.",
  url_host_blocked: "Deze link kan niet worden opgehaald.",
  no_readable_content: "Geen leesbare inhoud gevonden op deze pagina.",
  ai_share_link:
    "AI-chatlinks (ChatGPT, Claude…) kunnen niet worden opgehaald. Plak het gesprek hieronder.",
  blocked_by_site:
    "Deze site blokkeert geautomatiseerd ophalen. Plak de inhoud hieronder.",
  fetch_failed: "Kon de pagina niet ophalen. Controleer de link.",
  too_many_redirects: "De link verwijst te vaak door.",
  redirect_without_location: "Kon de pagina niet ophalen. Controleer de link.",
  not_allowed: "Je hebt (nog) geen rechten om hacks te maken.",
  generation_failed: "Genereren mislukt. Probeer het opnieuw.",
}

type PostMakerProps = {
  viewerName: string
  viewerAvatarUrl: string | null
}

/**
 * Thin wrapper: only mounts the modal body while `?compose=hack` is set, so the
 * body gets fresh state on every open (no manual reset-on-close effect).
 */
export function PostMakerModal(props: PostMakerProps) {
  const searchParams = useSearchParams()
  const open = searchParams.get(COMPOSE_PARAM) === COMPOSE_HACK
  if (!open) return null
  return <PostMakerModalContent {...props} />
}

function PostMakerModalContent({ viewerName, viewerAvatarUrl }: PostMakerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [url, setUrl] = useState("")
  const [conversation, setConversation] = useState("")
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [draft, setDraft] = useState<HackDraft | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [publishing, setPublishing] = useState(false)
  const channelsLoaded = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropzoneRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(COMPOSE_PARAM)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  // Body scroll lock + Escape, mirroring the search overlay.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [close])

  // Lazy-load channels on mount (the body only mounts while open).
  useEffect(() => {
    if (channelsLoaded.current) return
    channelsLoaded.current = true
    const supabase = createClient()
    supabase
      .from("channels")
      .select("id, slug, name")
      .eq("is_active", true)
      .order("name", { ascending: true })
      .then(({ data }) => setChannels((data ?? []) as Channel[]))
  }, [])

  const addScreenshotFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files).filter(isImageFile)
    if (list.length === 0) return

    try {
      const processed = await Promise.all(
        list.map(async (file) => ({
          id: crypto.randomUUID(),
          dataUrl: await downscaleScreenshot(file),
          name: file.name,
        }))
      )

      setScreenshots((prev) => {
        const remaining = MAX_SCREENSHOTS - prev.length
        if (remaining <= 0) {
          toast.error(`Maximaal ${MAX_SCREENSHOTS} screenshots per keer.`)
          return prev
        }
        const slice = processed.slice(0, remaining)
        if (slice.length < processed.length) {
          toast.error(`Maximaal ${MAX_SCREENSHOTS} screenshots per keer.`)
        }
        return [...prev, ...slice]
      })
    } catch {
      toast.error("Kon de afbeelding niet verwerken.")
    }
  }, [])

  function removeScreenshot(id: string) {
    setScreenshots((prev) => prev.filter((s) => s.id !== id))
  }

  // Clipboard paste of images into the dropzone area.
  useEffect(() => {
    const el = dropzoneRef.current
    if (!el) return
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.files
      if (!items?.length) return
      const images = Array.from(items).filter(isImageFile)
      if (images.length === 0) return
      e.preventDefault()
      void addScreenshotFiles(images)
    }
    el.addEventListener("paste", onPaste)
    return () => el.removeEventListener("paste", onPaste)
  }, [addScreenshotFiles])

  async function handleGenerate() {
    const hasUrl = url.trim().length > 0
    const hasScreenshots = screenshots.length > 0
    const hasConvo = conversation.trim().length > 0
    if (!hasUrl && !hasScreenshots && !hasConvo) {
      toast.error("Deel een link, upload een screenshot of plak een gesprek.")
      return
    }
    setGenerating(true)
    try {
      const payload = hasUrl
        ? { sourceType: "url" as const, url: url.trim() }
        : hasScreenshots
          ? {
              sourceType: "screenshot" as const,
              images: screenshots.map((s) => s.dataUrl),
            }
          : {
              sourceType: "conversation" as const,
              conversation: conversation.trim(),
            }

      const res = await fetch("/api/hacks/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = (await res.json()) as {
        draft?: HackDraft
        error?: string
      }
      if (!res.ok || !json.draft) {
        toast.error(GENERATE_ERRORS[json.error ?? ""] ?? "Genereren mislukt.")
        return
      }
      // Promote the structured action + tool into a single, fully-editable
      // headline (the user can rewrite it freely from here).
      setDraft({ ...json.draft, title: composeDefaultTitle(json.draft) })
      // Preselect suggested channels that exist.
      const suggested = new Set(json.draft.suggestedChannelSlugs)
      setSelected(
        new Set(
          channels.filter((c) => suggested.has(c.slug)).map((c) => c.id)
        )
      )
    } catch {
      toast.error("Genereren mislukt. Probeer het opnieuw.")
    } finally {
      setGenerating(false)
    }
  }

  function patchDraft(patch: Partial<HackDraft>) {
    setDraft((d) => (d ? { ...d, ...patch } : d))
  }

  function toggleChannel(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handlePublish() {
    if (!draft) return
    if (selected.size < 1) {
      toast.error("Kies minimaal 1 channel.")
      return
    }
    setPublishing(true)
    try {
      // Keep branding in sync with the final, user-edited title.
      const toolSlug = detectToolInTitle(draft.title)?.slug ?? draft.toolSlug
      const res = await publishHack({
        title: draft.title,
        summary: draft.summary,
        bodyMd: draft.bodyMd,
        postType: draft.postType,
        toolSlug,
        estimatedMinutes: draft.estimatedMinutes,
        goal: draft.goal,
        tagSlugs: draft.suggestedTagSlugs,
        channelIds: Array.from(selected),
      })
      if (!res.ok || !res.hackId) {
        toast.error(
          res.reason === "channel_required"
            ? "Kies minimaal 1 channel."
            : "Publiceren mislukt. Probeer het opnieuw."
        )
        return
      }
      toast.success("Gepubliceerd! Je verdient +250 XP \u{1F389}")
      // Navigating away removes ?compose=hack, which unmounts the modal.
      router.push(`/hacks/${res.hackId}`)
    } finally {
      setPublishing(false)
    }
  }

  const previewPost = draft
    ? buildPostFromDraft(draft, {
        name: viewerName,
        avatarUrl: viewerAvatarUrl,
      })
    : null

  return (
    <div
      data-lenis-prevent
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-background/70 p-4 backdrop-blur-sm sm:p-6 sm:pt-16"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div className="relative grid w-full max-w-5xl gap-4 lg:grid-cols-2 lg:items-start">
        {/* Left — source input */}
        <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-xl lg:max-h-[calc(100dvh-7rem)] lg:min-h-0 lg:overflow-y-auto">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Nieuwe post</h2>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={close}
              aria-label="Sluiten"
              className="rounded-full"
            >
              <X className="size-4" />
            </Button>
          </header>

          <div className="rounded-xl bg-muted/40 p-4">
            <label className="mb-1.5 block text-sm font-medium">
              Deel publieke link{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (artikel of blog)
              </span>
            </label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://blog.voorbeeld.nl/ai-tip"
              inputMode="url"
            />

            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              of
              <span className="h-px flex-1 bg-border" />
            </div>

            <label className="mb-1.5 block text-sm font-medium">
              Plak een AI agent gesprek
            </label>
            <Textarea
              value={conversation}
              onChange={(e) => setConversation(e.target.value)}
              placeholder="Plak hier het volledige gesprek..."
              className="min-h-40"
            />

            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              of
              <span className="h-px flex-1 bg-border" />
            </div>

            <label className="mb-1.5 block text-sm font-medium">
              Upload screenshot(s) van je gesprek
            </label>
            <div
              ref={dropzoneRef}
              tabIndex={0}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                void addScreenshotFiles(e.dataTransfer.files)
              }}
              className={cn(
                "rounded-xl border-2 border-dashed p-4 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-foreground/20",
                dragOver
                  ? "border-foreground bg-muted/60"
                  : "border-border bg-white hover:bg-muted/30"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    void addScreenshotFiles(e.target.files)
                  }
                  e.target.value = ""
                }}
              />

              {screenshots.length === 0 ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center gap-2 py-4 text-center text-sm text-muted-foreground"
                >
                  <ImagePlus className="size-8 opacity-60" />
                  <span>
                    Sleep screenshots hierheen, plak (Ctrl+V) of{" "}
                    <span className="font-medium text-foreground underline-offset-2 hover:underline">
                      kies bestanden
                    </span>
                  </span>
                  <span className="text-xs">
                    Max. {MAX_SCREENSHOTS} afbeeldingen
                  </span>
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    {screenshots.map((shot) => (
                      <div
                        key={shot.id}
                        className="group relative size-20 overflow-hidden rounded-lg border border-border bg-muted"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={shot.dataUrl}
                          alt={shot.name}
                          className="size-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeScreenshot(shot.id)}
                          aria-label={`Verwijder ${shot.name}`}
                          className="absolute top-1 right-1 inline-flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                    {screenshots.length < MAX_SCREENSHOTS ? (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex size-20 items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground hover:bg-muted/50"
                        aria-label="Voeg screenshot toe"
                      >
                        <ImagePlus className="size-6" />
                      </button>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {screenshots.length}/{MAX_SCREENSHOTS} — plak of sleep om
                    meer toe te voegen
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Persoonlijke gegevens worden verwijderd voordat dit wordt
              opgeslagen.
            </p>
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="shrink-0 gap-1.5"
            >
              {generating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Genereer
            </Button>
          </div>
        </section>

        {/* Right — editable preview + publish */}
        <section className="flex flex-col rounded-2xl border border-black/10 bg-white shadow-xl lg:max-h-[calc(100dvh-7rem)] lg:min-h-0">
          <div className="p-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {!draft ? (
              <div className="flex h-full min-h-72 flex-col items-center justify-center text-center">
                <h3 className="text-xl font-bold">Artikel draft</h3>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                  Deel een link, upload een screenshot of plak een gesprek en
                  druk op Genereer. Daarna kun je de hack bewerken en
                  publiceren.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {previewPost ? (
                  <div
                    aria-hidden
                    className="pointer-events-none select-none rounded-2xl bg-zinc-100 p-3"
                  >
                    <PostCard
                      post={previewPost}
                      summary={draft.summary}
                      saved={false}
                    />
                  </div>
                ) : null}

                <div className="flex flex-col gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Titel
                    </label>
                    <Input
                      value={draft.title}
                      onChange={(e) => patchDraft({ title: e.target.value })}
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Noem een tool (bijv. Figma, Cursor) en we tonen automatisch
                      het icoon.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-end gap-4">
                    <div className="min-w-0">
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Type
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {EDITABLE_POST_TYPES.map((t) => {
                          const on = draft.postType === t
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => patchDraft({ postType: t })}
                              aria-pressed={on}
                              className={cn(
                                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                                on
                                  ? "border-foreground bg-foreground text-background"
                                  : "border-border bg-white text-foreground hover:bg-muted"
                              )}
                            >
                              {POST_TYPE_LABEL[t]}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="w-28">
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Tijd (min)
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={240}
                        inputMode="numeric"
                        value={Number.isFinite(draft.estimatedMinutes) ? draft.estimatedMinutes : ""}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10)
                          patchDraft({
                            estimatedMinutes: Number.isNaN(n)
                              ? 0
                              : Math.min(240, Math.max(1, n)),
                          })
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Samenvatting
                    </label>
                    <Textarea
                      value={draft.summary}
                      onChange={(e) => patchDraft({ summary: e.target.value })}
                      className="min-h-20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Inhoud
                    </label>
                    <Textarea
                      value={draft.bodyMd}
                      onChange={(e) => patchDraft({ bodyMd: e.target.value })}
                      className="min-h-40"
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">
                    Channels toevoegen{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      (minimaal 1)
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {channels.map((c) => {
                      const on = selected.has(c.id)
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleChannel(c.id)}
                          aria-pressed={on}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                            on
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-white text-foreground hover:bg-muted"
                          )}
                        >
                          {c.name}
                        </button>
                      )
                    })}
                    {channels.length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        Channels laden...
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>

          <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-black/10 p-4">
            <span className="text-xs text-muted-foreground">
              and earn <span className="font-semibold text-foreground">+250 XP</span>
            </span>
            <Button
              type="button"
              onClick={handlePublish}
              disabled={!draft || selected.size < 1 || publishing}
              className="gap-1.5"
            >
              {publishing ? <Loader2 className="size-4 animate-spin" /> : null}
              Publish
            </Button>
          </footer>
        </section>
      </div>
    </div>
  )
}
