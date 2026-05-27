import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const requestSchema = z.object({
  query: z.string().max(500).optional().default(""),
  limit: z.number().int().min(1).max(50).optional().default(10),
})

/**
 * Thin search endpoint backing the future global Ask/Search bar (Track B2).
 * Calls `public.find_hacks(p_query, p_limit)` — see supabase/06_hack_search.sql.
 *
 * POST /api/search
 * Body: { query?: string, limit?: number }
 * Response: { hacks: HackRow[] }
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_body", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const { query, limit } = parsed.data

  const { data, error } = await supabase.rpc("find_hacks", {
    p_query: query.trim() || null,
    p_limit: limit,
  })

  if (error) {
    console.warn("[search] find_hacks rpc:", error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ hacks: data ?? [] })
}
