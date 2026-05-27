import Link from "next/link"
import { redirect } from "next/navigation"

import { buttonVariants } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/for-you")
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-10 p-6">
      <div className="mx-auto flex max-w-lg flex-col gap-3 text-center">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          Slimmerbezig
        </h1>
        <p className="text-muted-foreground text-balance text-sm">
          Korte AI-hacks die passen bij je werk, je tools en je collega&apos;s.
        </p>
      </div>
      <div className="mx-auto flex items-center justify-center">
        <Link href="/login" className={cn(buttonVariants({ size: "lg" }))}>
          Sign in
        </Link>
      </div>
    </div>
  )
}
