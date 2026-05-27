import Link from "next/link"
import { redirect } from "next/navigation"

import { signOut } from "@/app/auth/actions"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DeleteAccountButton } from "@/components/settings/delete-account-button"
import { PageHeader, PageShell } from "@/components/shell/page-header"
import { getViewer } from "@/lib/profile/get-viewer-profile"
import { cn } from "@/lib/utils"

export default async function SettingsPage() {
  const viewer = await getViewer()
  if (!viewer) redirect("/login")

  return (
    <PageShell>
      <PageHeader
        title="Account settings"
        description="Beheer je profiel, sessies en account."
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile signals</CardTitle>
          <CardDescription>
            Werk de signalen bij die je feed sturen.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            href="/onboarding"
          >
            Guided onboarding
          </Link>
          <Link
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            href="/checkin"
          >
            Weekly check-in
          </Link>
          <Link
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            href="/profile"
          >
            View profile
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
          <CardDescription>Log uit op dit apparaat.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signOut}>
            <Button type="submit" variant="destructive" size="sm">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>
            Verwijder je account en alle gekoppelde data. Onomkeerbaar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountButton />
        </CardContent>
      </Card>
    </PageShell>
  )
}
