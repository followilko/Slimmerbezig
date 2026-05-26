import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

function getBaseUrl(request: Request): string {
  const { origin } = new URL(request.url)
  const forwardedHost = request.headers.get("x-forwarded-host")
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https"
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost.split(",")[0]?.trim() ?? forwardedHost}`
  }
  return origin
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const nextRaw = searchParams.get("next")
  const next =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//")
      ? nextRaw
      : "/dashboard"

  const baseUrl = getBaseUrl(request)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  return NextResponse.redirect(`${baseUrl}/login?error=auth`)
}
