import Link from "next/link"
import { redirect } from "next/navigation"

import { signOut } from "@/app/auth/actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server"

type ProfileRow = {
  id: string
  full_name: string | null
  given_name: string | null
  family_name: string | null
  email: string | null
  avatar_url: string | null
  locale: string | null
}

function initialsFrom(profile: ProfileRow | null): string {
  const name =
    profile?.full_name?.trim() ||
    [profile?.given_name, profile?.family_name]
      .filter(Boolean)
      .join(" ")
      .trim()

  if (name?.length) {
    const parts = name.split(/\s+/).slice(0, 2)
    return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "U"
  }
  const emailFirst = profile?.email?.trim()?.charAt(0)
  return emailFirst?.toUpperCase() ?? "U"
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, given_name, family_name, email, avatar_url, locale"
    )
    .eq("id", user.id)
    .maybeSingle<ProfileRow>()

  const displayName =
    profile?.full_name?.trim() ||
    [profile?.given_name, profile?.family_name].filter(Boolean).join(" ").trim()

  const email = profile?.email ?? user.email ?? "—"

  return (
    <div className="flex flex-1 flex-col gap-8 p-6">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">
          Signed in via LinkedIn. Your profile row is saved in Supabase{" "}
          <code className="bg-muted rounded-md px-1 py-0.5 text-xs">profiles</code>
          .
        </p>
      </div>

      <Card className="mx-auto w-full max-w-lg">
        <CardHeader>
          <CardTitle>Your profile</CardTitle>
          <CardDescription>
            Stored in Postgres and linked to <code>{user.id}</code>
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
              {initialsFrom(profile)}
            </AvatarFallback>
          </Avatar>
          <dl className="flex flex-col gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground font-medium">Name</dt>
              <dd>{displayName?.length ? displayName : "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground font-medium">Email</dt>
              <dd>{email}</dd>
            </div>
            {profile?.locale ? (
              <div>
                <dt className="text-muted-foreground font-medium">Locale</dt>
                <dd>{profile.locale}</dd>
              </div>
            ) : null}
          </dl>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3 justify-between border-t pt-6">
          <Link
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            href="/"
          >
            Home
          </Link>
          <form action={signOut}>
            <Button type="submit" variant="destructive" size="sm">
              Sign out
            </Button>
          </form>
        </CardFooter>
      </Card>

      {!profile ? (
        <p className="text-muted-foreground mx-auto max-w-lg text-center text-sm">
          No profile row found yet — run{" "}
          <code className="bg-muted rounded-md px-1 py-0.5 text-xs">supabase/schema.sql</code>{" "}
          in the SQL Editor if you haven’t already, then sign out and sign in once more.
        </p>
      ) : null}
    </div>
  )
}
