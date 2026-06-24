import { Hash } from "lucide-react"
import Link from "next/link"

import { ChannelCard } from "@/components/channels/channel-card"
import { EmptyStateCard } from "@/components/shell/empty-state"
import { PageHeader, PageShell } from "@/components/shell/page-header"
import { listChannels } from "@/lib/channels/queries"
import { requireOnboarded } from "@/lib/auth/onboarding"
import { getViewerCapabilities } from "@/lib/levels"
import { getViewer } from "@/lib/profile/get-viewer-profile"
import { cn } from "@/lib/utils"

export default async function ChannelsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const viewer = await getViewer()
  requireOnboarded(viewer?.profile ?? null)

  const { q } = await searchParams
  const query = (q ?? "").trim().toLowerCase()

  const [all, capabilities] = await Promise.all([
    listChannels(),
    getViewerCapabilities(viewer!.userId, viewer!.profile),
  ])
  const canCreateChannels = capabilities.canCreateChannels

  const filtered = query
    ? all.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.description ?? "").toLowerCase().includes(query)
      )
    : all

  const mine = filtered.filter((c) => c.isMember)
  const discover = filtered.filter((c) => !c.isMember)

  return (
    <PageShell>
      <PageHeader
        title="Channels"
        description="Topiclusters met hacks en challenges. Word lid om updates te volgen."
      >
        {canCreateChannels ? (
          <Link
            href="/channels/new"
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-semibold text-background",
              "transition-colors hover:bg-foreground/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            )}
          >
            <Hash className="size-4" />
            Nieuw kanaal
          </Link>
        ) : null}
      </PageHeader>

      {query ? (
        <p className="text-sm text-muted-foreground">
          Resultaten voor &ldquo;{q}&rdquo; ({filtered.length})
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyStateCard
          title="Geen kanalen gevonden"
          description={
            canCreateChannels
              ? "Pas je zoekopdracht aan of start zelf een kanaal."
              : "Pas je zoekopdracht aan of ontdek andere kanalen."
          }
        >
          {canCreateChannels ? (
            <Link
              href="/channels/new"
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-semibold text-background",
                "transition-colors hover:bg-foreground/85"
              )}
            >
              <Hash className="size-4" />
              Nieuw kanaal
            </Link>
          ) : null}
        </EmptyStateCard>
      ) : null}

      {mine.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight">Jouw kanalen</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((c) => (
              <ChannelCard key={c.id} channel={c} />
            ))}
          </div>
        </section>
      ) : null}

      {discover.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight">
            {mine.length > 0 ? "Ontdek meer" : "Ontdek kanalen"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {discover.map((c) => (
              <ChannelCard key={c.id} channel={c} />
            ))}
          </div>
        </section>
      ) : null}
    </PageShell>
  )
}
