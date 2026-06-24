import { Hash } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ChannelJoinControls } from "@/components/channels/channel-join-controls"
import { ChannelOwnerHeader } from "@/components/channels/channel-owner-header"
import { ChannelPostGrid } from "@/components/channels/channel-post-grid"
import { EmptyStateCard } from "@/components/shell/empty-state"
import { PageShell } from "@/components/shell/page-header"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requireOnboarded } from "@/lib/auth/onboarding"
import { canAdminChannel } from "@/lib/channels/admin"
import {
  getChannelBySlug,
  getChannelChallenges,
  getChannelHackRows,
} from "@/lib/channels/queries"
import { getViewer } from "@/lib/profile/get-viewer-profile"
import { prepareFeedFromHacks } from "@/lib/posts/feed-items"
import { cn } from "@/lib/utils"

type Tab = "posts" | "challenges"

export default async function ChannelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const viewer = await getViewer()
  requireOnboarded(viewer?.profile ?? null)

  const { slug } = await params
  const channel = await getChannelBySlug(slug)
  if (!channel) notFound()

  const { tab: tabParam } = await searchParams
  const tab: Tab = tabParam === "challenges" ? "challenges" : "posts"
  const userId = viewer!.userId
  const canEdit =
    channel.ownerKind === "user" && channel.createdBy === userId
  const canAdmin = canAdminChannel(channel, userId, viewer!.profile)

  return (
    <PageShell>
      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {canEdit ? (
            <ChannelOwnerHeader
              slug={channel.slug}
              name={channel.name}
              description={channel.description}
              memberCount={channel.memberCount}
              hackCount={channel.hackCount}
              challengeCount={channel.challengeCount}
            />
          ) : (
            <div className="space-y-2">
              <h1 className="font-heading flex items-center gap-2 text-2xl font-semibold tracking-tight">
                <Hash className="size-6 text-muted-foreground" />
                {channel.name}
              </h1>
              {channel.description ? (
                <p className="max-w-2xl text-sm text-muted-foreground">
                  {channel.description}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                {channel.memberCount} leden &middot; {channel.hackCount} hacks
                &middot; {channel.challengeCount} challenges
              </p>
            </div>
          )}

          <ChannelJoinControls
            channelId={channel.id}
            slug={channel.slug}
            joined={channel.isMember}
            notify={channel.notify}
          />
        </div>

        <nav className="flex gap-1 border-b border-border">
          <TabLink slug={slug} tab="posts" active={tab === "posts"}>
            Posts
          </TabLink>
          <TabLink slug={slug} tab="challenges" active={tab === "challenges"}>
            Challenges
          </TabLink>
        </nav>
      </header>

      {tab === "posts" ? (
        <ChannelPostsTab
          channelId={channel.id}
          slug={channel.slug}
          pinnedHackId={channel.pinnedHackId}
          canAdmin={canAdmin}
          userId={userId}
        />
      ) : (
        <ChannelChallengesTab channelId={channel.id} />
      )}
    </PageShell>
  )
}

function TabLink({
  slug,
  tab,
  active,
  children,
}: {
  slug: string
  tab: Tab
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={`/channels/${slug}?tab=${tab}`}
      aria-current={active ? "page" : undefined}
      className={cn(
        "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </Link>
  )
}

async function ChannelPostsTab({
  channelId,
  slug,
  pinnedHackId,
  canAdmin,
  userId,
}: {
  channelId: string
  slug: string
  pinnedHackId: string | null
  canAdmin: boolean
  userId: string
}) {
  const rows = await getChannelHackRows(channelId, pinnedHackId)
  const items = await prepareFeedFromHacks(userId, rows)

  if (items.length === 0) {
    return (
      <EmptyStateCard
        title="Nog geen posts"
        description="Zodra leden hacks in dit kanaal plaatsen, verschijnen ze hier."
      />
    )
  }

  return (
    <ChannelPostGrid
      items={items}
      slug={slug}
      pinnedHackId={pinnedHackId}
      canAdmin={canAdmin}
    />
  )
}

async function ChannelChallengesTab({ channelId }: { channelId: string }) {
  const challenges = await getChannelChallenges(channelId)

  if (challenges.length === 0) {
    return (
      <EmptyStateCard
        title="Nog geen challenges"
        description="Challenges die aan dit kanaal gekoppeld zijn, komen hier te staan."
      />
    )
  }

  return (
    <div className="grid gap-3">
      {challenges.map((c) => (
        <Link key={c.id} href={`/challenges/${c.id}`} className="block">
          <Card className="transition-shadow hover:shadow-sm">
            <CardHeader className="gap-2 pb-3">
              <CardTitle className="text-base leading-snug">
                {c.title}
              </CardTitle>
              {c.body ? (
                <CardDescription className="line-clamp-2">
                  {c.body}
                </CardDescription>
              ) : null}
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  )
}
