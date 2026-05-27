"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export type CreateChallengeState = {
  ok: boolean
  reason?: string
}

export async function createChallenge(
  _prev: CreateChallengeState | null,
  formData: FormData
): Promise<CreateChallengeState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, reason: "Je moet ingelogd zijn om een challenge te plaatsen." }
  }

  const title = String(formData.get("title") ?? "").trim()
  const bodyRaw = String(formData.get("body") ?? "").trim()
  const body = bodyRaw.length > 0 ? bodyRaw : null
  const tagSlugsRaw = String(formData.get("tagSlugs") ?? "").trim()
  const tagSlugs = tagSlugsRaw
    ? tagSlugsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : []

  if (title.length < 3) {
    return { ok: false, reason: "Titel moet minimaal 3 tekens zijn." }
  }
  if (title.length > 120) {
    return { ok: false, reason: "Titel mag maximaal 120 tekens zijn." }
  }
  if (body && body.length > 2000) {
    return { ok: false, reason: "Beschrijving mag maximaal 2000 tekens zijn." }
  }

  const { data: challenge, error: insErr } = await supabase
    .from("challenges")
    .insert({
      user_id: user.id,
      title,
      body,
      status: "open",
    })
    .select("id")
    .single()

  if (insErr || !challenge) {
    return {
      ok: false,
      reason: insErr?.message ?? "Challenge kon niet worden aangemaakt.",
    }
  }

  const challengeId = challenge.id as string

  if (tagSlugs.length) {
    const { data: tags, error: tagErr } = await supabase
      .from("tags")
      .select("id, slug")
      .in("slug", tagSlugs)

    if (tagErr) {
      return { ok: false, reason: tagErr.message }
    }

    const junction = (tags ?? []).map((t) => ({
      challenge_id: challengeId,
      tag_id: t.id as string,
    }))

    if (junction.length) {
      const { error: jErr } = await supabase
        .from("challenge_tags")
        .insert(junction)
      if (jErr) {
        return { ok: false, reason: jErr.message }
      }
    }
  }

  revalidatePath("/challenges")
  redirect(`/challenges/${challengeId}`)
}
