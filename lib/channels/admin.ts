import type { ViewerProfile } from "@/lib/profile/get-viewer-profile"

import type { ChannelOverview } from "./queries"

/** Whether the viewer can pin/unpin hacks and edit channel settings. */
export function canAdminChannel(
  channel: ChannelOverview,
  userId: string,
  profile: ViewerProfile | null
): boolean {
  if (channel.ownerKind === "user") {
    return channel.createdBy === userId
  }
  const role = profile?.role
  return role === "curator" || role === "admin"
}
