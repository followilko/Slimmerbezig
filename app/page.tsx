import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function Home() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-10 p-6">
      <div className="mx-auto flex max-w-lg flex-col gap-3 text-center">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          Slimmerbezig
        </h1>
        <p className="text-muted-foreground text-balance text-sm">
          Next.js + Supabase + LinkedIn OIDC. Sign in to see your dashboard and
          sync your basic profile to Postgres.
        </p>
      </div>
      <div className="mx-auto flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/login"
          className={cn(buttonVariants({ size: "lg" }))}
        >
          Sign in
        </Link>
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          Dashboard
        </Link>
      </div>
    </div>
  )
}
