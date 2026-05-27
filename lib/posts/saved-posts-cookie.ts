import { cookies } from "next/headers"

const COOKIE_NAME = "saved_post_ids"
const MAX_AGE_SEC = 60 * 60 * 24 * 365

function parseIds(raw: string | undefined): string[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === "string")
  } catch {
    return []
  }
}

/** Saved dummy-post ids for the signed-in browser session (interim until DB wiring). */
export async function getSavedPostIds(): Promise<Set<string>> {
  const cookieStore = await cookies()
  return new Set(parseIds(cookieStore.get(COOKIE_NAME)?.value))
}

export async function getSavedPostCount(): Promise<number> {
  return (await getSavedPostIds()).size
}

export async function isPostSaved(postId: string): Promise<boolean> {
  return (await getSavedPostIds()).has(postId)
}

export async function writeSavedPostIds(ids: string[]): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, JSON.stringify([...new Set(ids)]), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  })
}
