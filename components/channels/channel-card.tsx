import { Hash } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ChannelOverview } from "@/lib/channels/queries"

export function ChannelCard({ channel }: { channel: ChannelOverview }) {
  return (
    <Link href={`/channels/${channel.slug}`} className="block">
      <Card className="h-full transition-shadow hover:shadow-sm">
        <CardHeader className="gap-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="flex items-center gap-1.5 text-base leading-snug">
              <Hash className="size-4 shrink-0 text-muted-foreground" />
              {channel.name}
            </CardTitle>
            {channel.isMember ? (
              <Badge variant="secondary">Lid</Badge>
            ) : null}
          </div>
          {channel.description ? (
            <CardDescription className="line-clamp-2">
              {channel.description}
            </CardDescription>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {channel.memberCount} leden &middot; {channel.hackCount} hacks
            &middot; {channel.challengeCount} challenges
          </p>
        </CardHeader>
      </Card>
    </Link>
  )
}
