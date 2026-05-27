import { redirect } from "next/navigation"

import type { ViewerProfile } from "@/lib/profile/get-viewer-profile"

/**
 * Hard-redirect to /onboarding when the viewer has not finished the coach
 * flow yet. Pages that intentionally stay reachable pre-onboarding
 * (/profile, /settings) simply don't call this.
 */
export function requireOnboarded(profile: ViewerProfile | null): void {
  if (!profile?.onboarded_at) {
    redirect("/onboarding")
  }
}
