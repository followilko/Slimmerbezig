/**
 * LinkedIn URL parser/validator — string-only, no network calls.
 *
 * MVP design (ADR 2026-05-27 — LinkedIn paste-only for MVP): we store the
 * normalized URL on `profiles.linkedin_url` and let the LLM extract any
 * pasted headline/about text. Phase 2 wires Proxycurl behind PROXYCURL_API_KEY.
 */

const VANITY_RE = /^[a-z0-9](?:[a-z0-9-]{2,98}[a-z0-9])$/i

/** Accepts a URL string. Returns a normalized canonical form + the vanity slug. */
export function validateLinkedinUrl(
  raw: string
): { ok: true; normalized: string; vanity: string } | { ok: false; reason: string } {
  if (!raw || typeof raw !== "string") {
    return { ok: false, reason: "empty_input" }
  }
  const trimmed = raw.trim()
  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
  } catch {
    return { ok: false, reason: "invalid_url" }
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, "")
  if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) {
    return { ok: false, reason: "not_linkedin_host" }
  }
  const match = url.pathname.match(/^\/in\/([^/?#]+)\/?$/i)
  if (!match) {
    return { ok: false, reason: "not_profile_path" }
  }
  const vanity = decodeURIComponent(match[1])
  if (!VANITY_RE.test(vanity)) {
    return { ok: false, reason: "invalid_vanity" }
  }
  return {
    ok: true,
    normalized: `https://www.linkedin.com/in/${vanity}/`,
    vanity,
  }
}
