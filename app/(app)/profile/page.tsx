import Link from "next/link"
import { redirect } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PageHeader, PageShell } from "@/components/shell/page-header"
import { isCreator } from "@/lib/auth/role"
import {
  displayNameFor,
  getViewer,
  initialsFor,
} from "@/lib/profile/get-viewer-profile"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

export default async function ProfilePage() {
  const viewer = await getViewer()
  if (!viewer) redirect("/login")

  const { profile } = viewer
  const displayName = displayNameFor(profile)
  const supabase = await createClient()
  const { data: understanding } = await supabase
    .from("profile_understanding")
    .select("summary")
    .eq("user_id", viewer.userId)
    .maybeSingle<{ summary: string | null }>()

  return (
    <PageShell>
      <PageHeader
        title="Your profile"
        description="Wat we van je weten — alleen jij ziet dit."
      >
        <Link
          href="/settings"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Account settings
        </Link>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{displayName ?? "Profile"}</CardTitle>
          <CardDescription>
            Stored in Postgres and linked to <code>{viewer.userId}</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Avatar className="size-24">
            {profile?.avatar_url?.trim() ? (
              <AvatarImage
                src={profile.avatar_url.trim()}
                alt={displayName ?? "Avatar"}
              />
            ) : null}
            <AvatarFallback className="text-lg">
              {initialsFor(profile)}
            </AvatarFallback>
          </Avatar>
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="Name" value={displayName ?? "—"} />
            <Row label="Email" value={profile?.email ?? "—"} />
            {profile?.sector ? (
              <Row label="Sector" value={profile.sector} />
            ) : null}
            {profile?.locale ? (
              <Row label="Locale" value={profile.locale} />
            ) : null}
            <Row
              label="Role"
              value={profile?.role ?? "learner"}
            />
            {isCreator(profile) ? (
              <Row label="Points" value="0 (ledger komt later)" />
            ) : null}
            {profile?.linkedin_url ? (
              <Row
                label="LinkedIn"
                value={
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    {profile.linkedin_url.replace(/^https?:\/\//, "")}
                  </a>
                }
              />
            ) : null}
          </dl>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 border-t pt-6">
          <Link
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            href="/onboarding"
          >
            Update onboarding
          </Link>
          <Link
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            href="/checkin"
          >
            Weekly check-in
          </Link>
        </CardFooter>
      </Card>

      {understanding?.summary ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Wat we van je weten
            </CardTitle>
            <CardDescription>
              Rolling samenvatting van de coach (privé).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{understanding.summary}</p>
          </CardContent>
        </Card>
      ) : null}
    </PageShell>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground font-medium">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
