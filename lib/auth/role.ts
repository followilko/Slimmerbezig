import type { ProfileRole, ViewerProfile } from "@/lib/profile/get-viewer-profile"

const CREATOR_ROLES: ReadonlyArray<ProfileRole> = ["creator", "curator", "admin"]

export function isCreator(profile: ViewerProfile | null): boolean {
  if (!profile?.role) return false
  return CREATOR_ROLES.includes(profile.role)
}

export function isAdmin(profile: ViewerProfile | null): boolean {
  return profile?.role === "admin"
}
