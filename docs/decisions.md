# Architecture decision record (ADR)

**Append-only.** Newest entries at the bottom. When you reverse a decision, add a new ADR that references the old one — don’t rewrite history.

---

## 2026-05-26 — Next.js 16 App Router + TypeScript + Tailwind + shadcn/ui

**Context:** Greenfield frontend; fast iteration with accessible components.

**Decision:** Use Next.js 16 App Router, TypeScript, Tailwind v4 patterns from the scaffold, shadcn/ui for UI primitives.

**Alternatives:** Vite SPA; Pages Router.

**Consequences:** File conventions (`app/`, Route Handlers) follow current Next docs under `node_modules/next/dist/docs/`.

---

## 2026-05-26 — Supabase Postgres + Auth, LinkedIn via OIDC (`linkedin_oidc`)

**Context:** Hosted Postgres + auth without building a bespoke backend day one.

**Decision:** Supabase Auth with provider **`linkedin_oidc`** (not deprecated classic LinkedIn). Use `@supabase/ssr` for cookies + SSR.

**Alternatives:** Auth0 / Clerk / custom OAuth.

**Consequences:** LinkedIn redirect whitelist points at **`…supabase.co/auth/v1/callback`**; app redirect URLs must list **`/auth/callback`** on each deployment host.

---

## 2026-05-26 — Root `proxy.ts` instead of `middleware.ts`

**Context:** Next.js 16 renames middleware file convention for clarity.

**Decision:** Implement session refresh / route protection in **`proxy.ts`** exporting `proxy`. Shared logic in **`lib/supabase/proxy.ts`**.

**Alternatives:** Keep deprecated `middleware.ts` only.

**Consequences:** **Never** commit both files. Clear `.next` if dev caches stale middleware paths.

---

## 2026-05-26 — Sign-out via Server Action (POST), not GET route

**Context:** GET sign-out is prefetched by Next `<Link>` and is CSRF-friendly.

**Decision:** `signOut` in **`app/auth/actions.ts`**; dashboard uses `<form action={signOut}>`.

**Alternatives:** GET `/auth/signout` route.

**Consequences:** No accidental logout on hover; slightly more boilerplate on UI.

---

## 2026-05-26 — Zod-validated public env at module load

**Context:** Missing Vercel env vars fail late with cryptic Supabase errors.

**Decision:** **`lib/env.ts`** parses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` with Zod; clients import `env`.

**Alternatives:** Loose `process.env.X!` everywhere.

**Consequences:** Fast fail on misconfiguration; build/runtime errors are readable.

---

## 2026-05-26 — Single Supabase project for dev + production (for now)

**Context:** Solo/small team; one live app + local dev.

**Decision:** One Supabase project; same anon URL/key in `.env.local` and Vercel.

**Alternatives:** Separate staging + prod projects.

**Consequences:** Schema changes hit “prod” data — prefer additive migrations; split projects before public launch if needed.

---

## 2026-05-26 — GitHub + Vercel auto-deploy from `main`

**Context:** Simple CD; preview deploys for branches.

**Decision:** Push to `main` deploys production URL; PRs get preview URLs.

**Alternatives:** Manual FTP, other hosts.

**Consequences:** Supabase redirect URL list must include production + optional preview wildcard.

---

## 2026-05-26 — OAuth callback respects `x-forwarded-host` / `x-forwarded-proto`

**Context:** Vercel sits behind a reverse proxy; `request.url` origin can be wrong.

**Decision:** **`app/auth/callback/route.ts`** builds redirect base from forwarded headers when present.

**Alternatives:** Hard-code production domain.

**Consequences:** Works on localhost, Vercel, and custom domains without code changes.

---

## 2026-05-26 — Tag overlap recommendations before embeddings

**Context:** Little content day one; need explainable matching.

**Decision:** SQL function **`get_recommended_hacks(limit)`** — overlap of hack tags with user sector tag + open frustration tags + all weekly check-in tags.

**Alternatives:** pgvector / OpenAI embeddings immediately.

**Consequences:** Simple, debuggable; upgrade path: add embedding column + hybrid rank later.

---

## 2026-05-26 — `profiles.role` gate: learner / creator / curator / admin

**Context:** Curated quality + eventual user contributions without opening spam.

**Decision:** Default **`learner`**. **`creator`** may insert user hacks with `author_id = self`. **`curator`/`admin`** manage tags and may insert **curated** hacks with **`author_id` null**.

**Alternatives:** Open posting; separate `is_moderator` boolean only.

**Consequences:** Manual promotion in Supabase Table Editor until automation exists.

---

## 2026-05-26 — `hacks.source`: `curated` vs `user`

**Context:** Same table for both streams; different policies and nullability.

**Decision:** `source` column distinguishes streams; curated rows may have **`author_id` null** (owned by platform / curators).

**Alternatives:** Separate `curated_hacks` table.

**Consequences:** One query surface; RLS must allow curator insert with null author.

---

## 2026-05-26 — Credits = append-only ledger (future)

**Context:** Balances from parallel writes race without transactions.

**Decision:** Sketch **`credit_ledger`** append-only rows; balance = **`sum(delta)`** per actor (see `supabase/future_schema.sql`).

**Alternatives:** Single `profiles.credits` counter.

**Consequences:** Safer concurrency; UI for “wallet” comes later.

---

## 2026-05-26 — ESCO-ready `tags.esco_uri` but no ingestion yet

**Context:** Skills taxonomy will matter long-term.

**Decision:** Nullable **`tags.esco_uri`** reserved; matching still tag/slug-based.

**Alternatives:** Full ESCO import at MVP.

**Consequences:** No migration pain when ontology arrives.

---

## 2026-05-26 — Project “brain” docs under `docs/`

**Context:** Chat history does not persist; onboarding every session is wasteful.

**Decision:** Maintain **`AGENTS.md`** + **`docs/{vision,decisions,data-model,glossary,roadmap}.md`** as committed source of truth.

**Alternatives:** Wiki outside repo only.

**Consequences:** Humans and agents sync via git; README stays operational, not visionary.

---

## 2026-05-26 — Launch as **B2B SaaS**, cross-org peer-learning deferred

**Context:** Long-term vision is people learning from peers in the **same field at other companies**. Day-one we need a buyer, a clear scope, and a working network effect inside one tenant.

**Decision:** Ship **B2B SaaS first** — content and feeds are scoped to an **organisation** (tenant). Cross-org peer-learning is a later phase once intra-org loops are sticky.

**Alternatives:** Public B2C app immediately; freemium individual accounts.

**Consequences:** Need **`organizations`** table, **`profiles.organization_id`**, org-scoped RLS, seat invitation flow. Top-level nav reflects scope: **For You / Communities / Office peers / Challenges**.

---

## 2026-05-26 — Hacks have a **post type** (effort range), not just a length

**Context:** A 30-second prompt tip and a 45-minute workflow guide should not look the same in the feed or rank the same.

**Decision:** Add **`hacks.post_type ∈ {bite, recipe, guide, external}`** (`bite` ≲5 min, `recipe` 5–30 min, `guide` 30–60+ min, `external` = curated off-platform link).

**Alternatives:** Free-form duration text; only word-count heuristic.

**Consequences:** Feed UI can filter by effort; recommendation can favour bite-sized for new users; **`external`** unlocks ADR “External hack sources” below.

---

## 2026-05-26 — Structured **Goal × Tool × AI-capability** taxonomy on hacks

**Context:** Free tags drift; users want “automate × Excel × structured_extraction” style filters.

**Decision:** Each hack carries three structured fields:

- **`hacks.goal`** enum: `automate | analyse | generate | organise | communicate | learn | decide`.
- **Tool** as **`tags.kind='tool'`** (e.g. `chatgpt`, `excel`, `figma`).
- **AI capability** as **`tags.kind='capability'`** (e.g. `text_generation`, `agents`, `transcription`).

Hacks must link **≥1 tool tag and ≥1 capability tag** when status=`published`.

**Alternatives:** All free tags; or hardcoded enum for tools/capabilities.

**Consequences:** Stronger filters, better matching, smoother UI faceting. **`tags_kind_check`** must add **`capability`**; insert/publish validation enforces required link kinds.

---

## 2026-05-26 — Challenges answered by **comments and/or hack links**

**Context:** Some challenges are best solved by a quick reply, others by pointing to (or authoring) a proper hack.

**Decision:** Two response paths on a challenge:

1. **Comment** (text in `challenge_comments`).
2. **Hack link** — comment optionally references a `hack_id` (existing or self-promoted by the commenter).

A user **may promote their own hack** as a solution explicitly (UI affordance; data: comment with `hack_id` set + `is_self_promotion = true`).

**Alternatives:** Comments only; or a separate `challenge_solutions` table.

**Consequences:** Plain text answers stay lightweight; hack-linked answers feed back into the hack’s social proof. Need moderation hooks against pure self-promo spam.

---

## 2026-05-26 — **Praise → points** signal on hacks and comments

**Context:** Need a single-tap “this helped me” signal that can later drive reputation/economy without committing to a redemption model yet.

**Decision:** Add **praise** on both **hacks** and **challenge comments** (one praise per `(user, target)`). Each praise writes a row to an append-only **points ledger** crediting the author. Surface a **points** counter on profiles. **Redemption mechanics are deferred.**

**Alternatives:** Likes only with no ledger; immediate credits with balance column.

**Consequences:** Schema needs `hack_praises`, `comment_praises`, and the ledger from **`supabase/future_schema.sql`** promoted (or a slim equivalent). Race-safe by design (append-only).

---

## 2026-05-26 — **External** hack source allowed, curator-only

**Context:** Plenty of high-signal AI content lives on Twitter/X, LinkedIn, YouTube, and blogs. Linking it gracefully beats forcing every contributor to rewrite.

**Decision:** Extend **`hacks.source`** to include **`external`** and add **`hacks.source_url`** (nullable; required when `source='external'`). Only **`curator` / `admin`** can insert/update `source='external'` rows. The original author is recorded in free text (e.g. `hacks.external_author`) — no off-platform user accounts.

**Alternatives:** Disallow external; or let any creator post links (spam risk).

**Consequences:** Curation backlog grows but feed quality stays controllable. Need RLS update + URL-validation constraint + a small "Submit a link for curation" intake (later) so non-curators can suggest without bypassing the gate.

---

## 2026-05-27 — LLM coach via OpenAI + Vercel AI SDK

**Context:** Onboarding/check-ins produce rich natural language — we still need deterministic rows for **`get_recommended_hacks`**, explainability, and GDPR-friendly minimization.

**Decision:** **`streamText`** on **`gpt-4o-mini`** (`@ai-sdk/openai`), Next.js **`app/api/onboarding/chat/route.ts`** returning **`toUIMessageStreamResponse`**, **`@ai-sdk/react` `useChat` + `DefaultChatTransport`** for streaming UI.

**Alternatives:** Call OpenAI REST only; Claude-only stack; bespoke SSE.

**Consequences:** Model swap stays an import swap; **`convertToModelMessages` is awaited (AI SDK 6)**. Missing **`OPENAI_API_KEY`** returns **503** so builds/deploys without secrets still compile.

---

## 2026-05-27 — Hybrid conversational onboarding/check-in + tool writes

**Context:** UX must feel like a coherent chat yet feed logic needs structured slots.

**Decision:** Hybrid flow — conversational steering with **explicit tools** (**`set_sector`**, **`add_frustration`**, **`add_interest`**, **`update_understanding`**, **`save_weekly_checkin`**, completions, curator queue) instead of unstructured post-hoc scraping.

**Alternatives:** Pure multi-step wizard; unstructured summarization blobs only.

**Consequences:** Token/tool discipline + schema alignment; curator queue handles unknown tools/tags.

---

## 2026-05-27 — `profile_understanding` + transcripts + stub mode

**Context:** Returning users deserve continuity across sessions without re-reading whole history each call.

**Decision:** Persist **`profile_understanding.summary`** + **`signals` json** (user-owned, RLS) and **`chat_messages`** JSON payloads per assistant turn plus optional **`AI_CHAT_STUB_TOOLS=true`** dry-run (`lib/env.server.ts`).

**Alternatives:** Only embed vectors; ephemeral session memory.

**Consequences:** Narrative coherence + observability + safe local demos before SQL migrations run.

---

## 2026-05-27 — `tag_suggestions` gate for learner/LLM vocabulary

**Context:** Controlled **`tags`** must not sprawl arbitrarily (spam + matching drift).

**Decision:** **`tag_suggestions`** queue with learner insert + curator/admin approvals; **`propose_tag` tool writes here only**.

**Alternatives:** Let creators insert tags freely; unstructured free tags per user.

**Consequences:** Human approval latency but stable taxonomy hygiene.

---

## 2026-05-27 — Standard animation stack: GSAP + ScrollTrigger + CustomEase + Lenis (npm)

**Context:** The product relies on deliberate micro-interactions — page feel, scroll-linked motion, easing control — without fighting the Next.js router or auth proxy.

**Decision:** Ship **`gsap`** (MIT; includes **ScrollTrigger** and **CustomEase** as separate plugin imports), **`lenis`** for smooth scrolling, `@/` integration with a single **`registerGsap()`** helper, **`SmoothScrollProvider`** (Lenis **`autoRaf: false`** + **`gsap.ticker`** drives **`lenis.raf`**, **`ScrollTrigger.update`** on Lenis **`scroll`**), **`prefers-reduced-motion`** turns off Lenis **`smoothWheel`**, **`app/template.tsx`** runs a minimal GSAP route-enter tween and calls **`ScrollTrigger.refresh()`** on complete.

**Alternatives:** Raw CSS-only motion; CDN `<script>` tags; **Barba.js** or other full-page AJAX routers.

**Consequences:** One idiomatic toolkit for agents to reach for first (`AGENTS.md` “Animation stack”); tree-shakable npm imports; SSR stays server-first — animations are client-mounted only.

---

## 2026-05-27 — No Barba — page transitions via `app/template.tsx` + GSAP

**Context:** **Barba** intercepts navigations and swaps DOM islands; **Next.js 16 App Router** owns routing, RSC boundaries, prefetch, **`proxy.ts`** session refresh redirects, and **Server Actions** (e.g. sign-out).

**Decision:** Do **not** integrate `@barba/core`. Prefer **route `template.tsx` remounts** + GSAP for enter animations and Lenis/ScrollTrigger hygiene.

**Alternatives:** Barba + fight the framework; View Transitions API only.

**Consequences:** Predictable auth and data loading; “Barba-like” page-in is approximated with `template`, not a second router.

---

## 2026-05-27 — Onboarding capped at 3 questions; coverage-driven steering

**Context:** The first onboarding chat had no upper bound on length and the model self-judged when coverage was “enough”, leading to drift and premature `finish_onboarding` calls. We also want a single, falsifiable success metric: did onboarding produce enough signal for `get_recommended_hacks(5)` to return ≥5 rows?

**Decision:** Cap onboarding at **3 user turns** scripted in the system prompt (Identity / Friction / Toolkit), with multi-extract tool calls per turn. Introduce a server-side `Coverage` snapshot ([`lib/ai/coverage.ts`](../lib/ai/coverage.ts)) computed each request, surfaced as `CAPTURED_SO_FAR` + `STILL_NEEDED` blocks in the system prompt, and re-checked inside `finish_onboarding` / `finish_checkin` as a hard gate. Thresholds: **sector + ≥1 frustration + ≥2 tool/capability interests** for onboarding; **a weekly_checkins row for the current UTC week** for check-in.

**Alternatives:** Pure prompt tuning; client-side checklist only; relax to 5 questions.

**Consequences:** Steering improves on `gpt-4o-mini` without a model swap; finish-quality is server-enforced; remaining interest growth is delegated to the Ask flow (Track B) + implicit signals (Track C). Coverage helper is the single source of truth — reuse it before any “are we onboarded?” check in the app.

---

## 2026-05-27 — LinkedIn paste-only for MVP; Proxycurl deferred to Phase 2

**Context:** Public LinkedIn profile pages are gated against server-side fetching. The official Marketing API requires app review most apps can’t get; reliable scraping needs paid third-party providers (Proxycurl, Lix, ScrapingBee). We still want the onboarding coach to feel informed about the user.

**Decision:** **MVP**: store a normalized `profiles.linkedin_url` plus an optional headline/about paste the LLM extracts during Q1 (`record_linkedin` tool). No outbound fetch. URL shape validated by [`lib/ai/linkedin.ts`](../lib/ai/linkedin.ts). **Phase 2**: introduce `PROXYCURL_API_KEY` env var; when set, server fetches the profile and prefills the confirmation card — same column, additive change.

**Alternatives:** Proxycurl from day one (~$0.01–0.10/profile); URL-only with no extraction; OpenAI browser tool (flaky against LinkedIn).

**Consequences:** Zero external dependency for sign-up; the LLM still gets free-text richness via the optional headline paste. Phase 2 uplift is one route handler + env flag, no schema change.

---

## 2026-05-27 — Auto-greet onboarding; redirect to `/for-you` on finish

**Context:** Empty chat surfaces force the user to type the first message — high friction at sign-up. Returning users hit the same empty surface even though `profile_understanding.summary` is persisted. Once onboarding finishes, the user has no automatic destination.

**Decision:** [`app/onboarding/page.tsx`](../app/onboarding/page.tsx) server-renders a Dutch greeting (first-time vs returning, name-aware, summary-excerpt-aware) and passes it as `initialAssistantText` to `<CoachChat>`. The chat client component pre-seeds a synthetic assistant message. When the finish tool returns `{ ok: true }`, the client pushes the router to `redirectOnFinishTo` (set to `/for-you` for onboarding). `app/for-you/page.tsx` server-guards the inverse: not onboarded → redirect back to `/onboarding`.

**Alternatives:** Client-side greeting only (loses SSR personalization); always start blank; bounce through `/dashboard`.

**Consequences:** Onboarding feels conversational from the first paint; returning users land on continuity; success state has a clear destination. `/for-you` is currently a placeholder rendering `get_recommended_hacks(20)` — its richer UI is Track C.

---

## 2026-05-27 — `/for-you` is the personal feed URL (not `/feed`)

**Context:** Roadmap originally listed `/feed`; vision/IA lists “For You” as one of several future feed types (Communities / Office peers / Challenges).

**Decision:** Mount the personalized feed at **`/for-you`**. Future feeds get their own routes (`/communities`, `/office`, `/challenges`). Keep the URL space flat and self-describing.

**Alternatives:** `/feed` with query params (`/feed?type=for-you`); nested under `/feeds/for-you`.

**Consequences:** Onboarding redirect target is `/for-you`. Future ADRs adding `/popular`, `/office`, etc. follow the same flat-URL pattern.

---

## 2026-05-27 — Soft coverage hints (supersedes the hard finish gate)

**Context:** The first cut of Track A used `isFinishAllowed` inside `finish_onboarding` / `finish_checkin` to block the close until `sector + ≥1 frustration + ≥2 tool/capability interests` were on file. In testing this produced exactly the wrong UX: when the user mentioned a tool absent from VOCAB (e.g. "Granola"), the model called `propose_tag` and then looped trying to use `add_interest`, eventually telling the user *"Het lijkt erop dat ik geen geschikte tag voor vaardigheden kan toevoegen zonder dat je specifieker bent."* The chat felt like a form, not a conversation.

**Decision:** Remove the server-side finish gate entirely. `finish_onboarding` and `finish_checkin` now always succeed (setting `onboarded_at` / closing the session). Coverage thresholds become **soft hints** (`COVERAGE_TARGETS` in [`lib/ai/coverage.ts`](../lib/ai/coverage.ts)) surfaced to the prompt as an `AIM_FOR` block. The coach decides when to wrap up based on the conversation. `add_interest` returns `{ ok: true, matched, unmatched, hint }` instead of `{ ok: false }` for unmatched slugs, with an explicit anti-loop hint. The system prompt enforces *"Never lecture or insist; thanks-that's-enough is always a valid ending"* and *"propose_tag once for unknown names, then move on — never retry add_interest with proposed slugs"*.

**Supersedes:** "2026-05-27 — Onboarding capped at 3 questions; coverage-driven steering" (the cap and the steering hints survive — only the hard gate is dropped).

**Alternatives:** Lower thresholds (e.g. `sector OR 1 frustration`); turn-count gate (refuse only before turn 1); per-tool feedback in the UI.

**Consequences:** Onboarding feels human and degrades gracefully — even a one-word reply gets the user onto `/for-you`. Trade-off: a user who quits in 30 seconds may land on an empty For You feed; the page's `EmptyState` explains how to add more signals via `/onboarding` or `/checkin`. The coverage helper stays valuable for two reasons: (1) the `CAPTURED_SO_FAR` block gives the model situational awareness so it doesn't re-ask, and (2) Track C will reuse it for "feed quality score" badges later.

---

## 2026-05-27 — `get_recommended_hacks` v2: implicit signals feed the rank

**Context:** v1 only used tag-overlap (sector ∪ open frustrations ∪ weekly check-ins ∪ user_interests). `hack_interactions` already records `saved / viewed / completed / helpful / not_helpful` but those rows had zero effect on the recommendation order. Users marking hacks helpful or not_helpful saw no behavioural payoff in their feed — the loop wasn't closed.

**Decision:** Replace `public.get_recommended_hacks(p_limit)` ([supabase/05_recommendation_v2.sql](../supabase/05_recommendation_v2.sql)) with a scored variant that layers implicit signals on the same tag-overlap base:

```
score(hack) =
    overlap_count                            (v1 base)
  + 2.0 * helpful_tag_overlap_count          (boost: shares tags with helpful hacks)
  - 0.5 * viewed_count                       (decay: deprioritize repeats)
  - 1.0 * completed_count                    (harder decay: user reports doing it)
hard exclude: any hack the user marked not_helpful
keep filter:  score > 0
```

Same signature (`returns setof public.hacks`), same SECURITY INVOKER posture, same RLS scoping. Only the body changed. Coefficients chosen as a starting algebra — easy to tune via ADR follow-up. New users with no interactions get v1 behaviour exactly.

`/for-you` (Track C2) now ships a `<HackCardActions />` client component with thumbs-up / thumbs-down / save buttons; server actions in [`app/for-you/actions.ts`](../app/for-you/actions.ts) (`setReaction`, `toggleSave`) write to `hack_interactions` and `revalidatePath('/for-you')` so the next paint reranks.

**Alternatives:** Surface the score, do per-tag weighting, push to a nightly job, jump straight to pgvector embeddings.

**Consequences:** The feed becomes alive within a session — thumbs-up on a hack about "standup notes" lifts other "standup notes" hacks immediately. Trade-off: hacks the user views often without interacting will quietly fade; if that proves too aggressive we lower the `viewed` coefficient. Auto-`viewed` via IntersectionObserver is intentionally deferred to a follow-up — the current loop is button-driven and explicit. Track C3 (Ask system prompt sees a `RECENT_FEEDBACK` digest) builds on top of this.

---

## 2026-05-27 — Postgres FTS for hack search (`find_hacks`); pgvector deferred

**Context:** Track B (continuous Ask/Search bar) needs a retrieval backbone. Hack content lives in `public.hacks.title / summary / body_md` — three fields with different signal weights. We have ~zero content at launch and a corpus that will mix Dutch and English, so a heavy embedding setup is overkill for now and an English-stemmed tsvector would mangle non-English content.

**Decision:** Add a STORED weighted tsvector column ([supabase/06_hack_search.sql](../supabase/06_hack_search.sql)):

```
search_tsv =
    setweight(to_tsvector('simple', title),    'A')
 || setweight(to_tsvector('simple', summary),  'B')
 || setweight(to_tsvector('simple', body_md),  'C')
```

GIN-indexed. Queries via `public.find_hacks(p_query text, p_limit int)` using `websearch_to_tsquery('simple', …)` (handles `"phrases"`, `and / or / -negation` naturally) and ranked with `ts_rank_cd`. Empty / null query returns most recent published hacks (graceful fallback for an empty bar). SECURITY INVOKER + existing hacks RLS scopes visibility to `status = 'published'`.

Smoke-test API at `POST /api/search` ([app/api/search/route.ts](../app/api/search/route.ts)) accepts `{ query?, limit? }` and returns `{ hacks: HackRow[] }`. This is the seam the future AskBar (B2) and `find_hacks` AI tool (B3) both call.

**Alternatives:**
- `'english'` text-search config — stems English well, butchers Dutch
- One tsvector column per locale (e.g. `search_tsv_nl`, `search_tsv_en`) with a routing column — defer until corpus is large enough to matter
- `pgvector` embeddings — better semantic match, requires an embedding pipeline + cost + reindexing; revisit when content density justifies it
- Trigram (`pg_trgm`) similarity — better for typos, weaker for natural language; can layer in later

**Consequences:** Cheap, fast, zero-dependency search seam that ships today. `'simple'` config trades stemming for locale safety (you get exact-token matches but no plurals/conjugations). Future ADR will add hybrid `pgvector + ts_rank_cd` once the corpus warrants it. The `find_hacks` signature is stable enough to keep when the implementation upgrades.

---

## 2026-05-27 — Self-serve account delete via SECURITY DEFINER RPC

**Context:** Developers and testers need a fast way to wipe their account and re-run onboarding/check-in/feed from a clean slate without juggling Supabase Table Editor or a separate staging project.

**Decision:** Add **`public.delete_my_account()`** in [`supabase/04_delete_account.sql`](../supabase/04_delete_account.sql): **`SECURITY DEFINER`**, **`auth.uid()`** must match the row deleted from **`auth.users`**, **`GRANT EXECUTE` to `authenticated` only**. App calls it from a POST **Server Action** ([`deleteAccount` in `app/auth/actions.ts`](../app/auth/actions.ts)) after a two-step confirm on **`/dashboard`**. No **`SUPABASE_SERVICE_ROLE_KEY`** in the app.

**Alternatives:** Admin API delete user (requires service role + env plumbing); soft-delete columns only (does not reset OAuth-linked identity cleanly); manual deletes in Dashboard.

**Consequences:** Deleting **`auth.users`** cascades to **`profiles`** and all tables that FK to **`profiles` with ON DELETE CASCADE**; **`hacks.author_id`** remains **ON DELETE SET NULL** so authored hacks are not removed, only detached from the deleted user — suitable for curated/test content survival. Production users get the same affordance unless we gate it later (e.g. env or feature flag).

---

## 2026-05-27 — Continuous Ask/Search bar (global chrome)

**Context:** Track B of the AI sprint promises one always-on entry point on every page where the user can either (a) *search* existing hacks by free text, or (b) *ask* the coach a question that resolves with a chat overlay. The vision file calls this the "search/ask switch" on top-level feeds.

**Decision:** Ship a single client component **`<AskBar />`** ([components/feed/ask-bar.tsx](../components/feed/ask-bar.tsx)) mounted globally inside [app/providers.tsx](../app/providers.tsx). Layout choices:

- Fixed bottom-center, `max-w-2xl`, pill-shaped, two pressable tabs (**Search / Ask**) + a single input.
- **GSAP**-driven minimize on scroll-down past 80px (translateY 80%, opacity 0.55); restores on scroll-up. Native `scroll` listener — Lenis updates `window.scrollY` via the gsap.ticker bridge already configured in **`SmoothScrollProvider`**, so no extra plumbing needed.
- **Cmd+K** / **Ctrl+K** focuses the input from anywhere.
- **Search tab:** debounced 200ms POST to `/api/search` ([app/api/search/route.ts](../app/api/search/route.ts), shipped in the prior ADR) via [components/feed/ask-search-results.tsx](../components/feed/ask-search-results.tsx). Renders top-5 results inline + a "see all" link to a future `/search?q=…` page.
- **Ask tab:** typing + submit opens [components/feed/ask-overlay.tsx](../components/feed/ask-overlay.tsx) — an 85vh modal hosting the existing **`<CoachChat>`** wired to `/api/ask/chat` (B4). The user's pre-typed question is forwarded via a new **`autoSendUserText`** prop so the conversation starts immediately.
- **Hidden on:** `/login`, `/onboarding`, `/checkin`, `/auth/*`. Those flows own the full viewport.

**Alternatives:** A global top header bar (less prominent, competes with primary nav); per-page floating action buttons (fragmented UX); a SwiftUI-style modal-only Ask with no inline search (loses the "I just want to find something" speed). A header-mounted dropdown was rejected because the user explicitly wants this to live bottom-center and minimize on scroll.

**Consequences:** One mount point, one tab switch, one entry into both retrieval modes — no nav redesign needed. The component is a stub for the eventual **`/search?q=…`** page (just a link target for now). Because `<CoachChat>` carries the renderer/sidebar/auto-send props introduced here, future overlays (e.g. an inline "coach me on this hack" embed) get the same machinery for free.

---

## 2026-05-27 — Ask is a rolling, never-closing chat session

**Context:** The Ask overlay needs persistent memory across page loads (the user expects continuity when they re-open the bar later in the day) but should NEVER hit a "finish_*" tool — there is no wrap-up, no destination redirect. Onboarding and check-in both close their session after `finish_*`; ask must not.

**Decision:** Extend `chat_sessions_kind_check` to allow `'ask'` ([supabase/07_ask_session.sql](../supabase/07_ask_session.sql)) and treat the existing `chat_sessions_one_open_per_user_kind_idx` unique partial index (`WHERE status = 'open'`) as the rolling-session enforcer — there is exactly one open ask session per user, ever. **`ensureOpenChatSession(supabase, userId, 'ask')`** ([lib/ai/session.ts](../lib/ai/session.ts)) returns the same row turn after turn. No `finish_ask` tool is introduced. Each turn is persisted via the unchanged **`persistChatTurn`** so the row count grows linearly.

[`createChatTools`](../lib/ai/tools.ts) gains an `ask` branch: the `sharedTools` pool (set_sector, record_linkedin, add_frustration, add_interest, update_understanding, propose_tag) + a new `find_hacks(query, limit?)` tool that wraps the **`public.find_hacks`** FTS RPC. Finish tools are NOT exposed in ask. The system prompt's new **ASK MODE** section (in [lib/ai/system-prompt.ts](../lib/ai/system-prompt.ts)) instructs the model to be brief (1–3 sentences), narrate not dump, and never recommend a "wrap-up" since there is none.

**Alternatives:**
- One session per overlay open (loses continuity across page loads; spams `chat_sessions` rows).
- A `last_n` cap inside the unique index (over-engineering — the route already trims the client transcript to 100 messages before invoking the model).
- A `finish_ask` tool that re-opens on next message (extra state, no upside).

**Consequences:** Ask transcripts grow unbounded per user, but the API route trims to the last 100 messages (`MAX_MESSAGES` in [app/api/ask/chat/route.ts](../app/api/ask/chat/route.ts)) before calling the model, and `profile_understanding.summary` carries older signal across. A future ADR can add a server-side hydrate (`GET /api/ask/history?limit=50`) so re-opening the overlay restores the visible thread; today the client surface starts fresh each open while the DB retains everything.

---

## 2026-05-27 — `find_hacks` AI tool + custom tool renderer in `<CoachChat>`

**Context:** When the Ask coach surfaces hacks, the user should get clickable cards — not a wall of titles or a JSON debug blob. The existing `<CoachChat>` rendered every tool part as italic "Structured update: tool_name…" which is fine for onboarding (curators want the audit trail visible) but useless for Ask.

**Decision:** Add a `toolRenderers?: Record<string, (output: unknown) => ReactNode>` prop to **`<CoachChat>`** ([components/ai/coach-chat.tsx](../components/ai/coach-chat.tsx)). When a tool reaches `state === 'output-available'` *and* the chat has a matching renderer, the renderer replaces the default placeholder; otherwise the placeholder still shows ("Structured update: tool_name…").

For Ask, the renderer is [components/feed/find-hacks-renderer.tsx](../components/feed/find-hacks-renderer.tsx) — a function (not a JSX file with a default export) that turns `{ hacks: [{id, title, summary, source}] }` into a grid of `<Link href="/hacks/{id}">` cards inline below the assistant's narration.

Two adjacent `<CoachChat>` props ship in the same edit:
- **`autoSendUserText?: string`** — fired once on mount via a `useRef` guard. Lets the AskBar pass the user's pre-typed question straight into the chat without a manual "send" step.
- **`hideSidebar?: boolean`** + **`compact?: boolean`** — strip the right-hand "what we've captured" debug card and the outer `<Card>` chrome when the chat is embedded in another shell (the Ask overlay).

**Alternatives:**
- Write a dedicated `AskChat` component duplicating most of `<CoachChat>` (DRY loss; two surfaces to keep in sync with `useChat` API drift).
- Always-on inline rendering with a global registry (hides intent; one chat can use different renderers).
- Server-side render the cards from the persisted tool result on next refresh (requires a /hacks lookup route; ignores live streaming UX).

**Consequences:** The same chat component now powers three modes (onboarding / checkin / ask) cleanly. Adding new "rich" tool outputs in the future (e.g. a `propose_external_hack` curator action with a preview card) is a one-line `toolRenderers` map entry. Default placeholder is preserved for any unmapped tool, so onboarding and check-in keep their existing debug-style display untouched.

---

## 2026-05-27 — Auto-`viewed` via IntersectionObserver (C2.1)

**Context:** [ADR 2026-05-27 — `get_recommended_hacks` v2] introduced a `viewed` decay coefficient (`−0.5 * viewed_count`), but in practice nothing was inserting `viewed` rows — the explicit thumbs/save buttons only emit `helpful`, `not_helpful`, and `saved`. Without a passive view signal the decay never fires; hacks the user has clearly seen but ignored keep ranking the same.

**Decision:** Ship **`<HackViewTracker />`** ([components/feed/hack-view-tracker.tsx](../components/feed/hack-view-tracker.tsx)) — a tiny absolutely-positioned `<div>` mounted inside each `<HackCard>` on `/for-you`. It runs an `IntersectionObserver` (threshold 0.5) and, after the card has been ≥50% in the viewport for ≥2s, fires a `recordView(hackId)` Server Action ([app/for-you/actions.ts](../app/for-you/actions.ts)). The action inserts a single row into `hack_interactions(kind='viewed')`; the (`user_id`, `hack_id`, `kind`) primary key turns duplicates into a no-op (Postgres error `23505`, swallowed and treated as success).

The tracker is one-shot per page load (cleared on unmount or after the dwell timer fires) and accepts `alreadyViewed` from the server-rendered interaction set so we don't even start the observer for hacks the user has previously viewed. **No `revalidatePath`** runs on `recordView` — we never want the act of looking at a card to redraw the feed under the user.

**Alternatives:**
- Fire `viewed` on `mouseenter` / `click` of the card (false positives from accidental hovers; misses scroll-by reads).
- Persist `viewed` only when the user opens the hack detail page (catches deep engagement but not the everyday "I skimmed the title and moved on" signal that justifies the decay).
- Decrement `viewed_count` after a TTL — adds clock math to the recommendation RPC; defer until we see if the simple coefficient is too aggressive.

**Consequences:** The v2 recommendation algorithm finally sees a passive signal. Two follow-ups are worth flagging if the decay over-fires: lower the `viewed` coefficient (currently `−0.5`) or raise the dwell time (currently 2000ms). The PK-conflict-as-success pattern means concurrent observers on the same card (e.g. card visible across re-renders) cannot create duplicate rows.

---

## 2026-05-27 — Ask system prompt carries last-14d feedback digest (C3)

**Context:** The Ask coach has `CONTEXT_SUMMARY` (rolling LLM-authored summary on `profile_understanding`) but no signal about *what the user said no to* in the recent past. Recommending a Notion hack to a user who just thumbs-downed two Notion hacks is the worst kind of dumb.

**Decision:** Add [lib/ai/recent-feedback.ts](../lib/ai/recent-feedback.ts) → **`getRecentFeedback(supabase, userId)`** that returns the union of tag slugs from hacks the user has marked `helpful`, the same for `not_helpful`, and a saved-hack count over the last 14 days (two lightweight join queries; RLS scopes to the caller). [lib/ai/system-prompt.ts](../lib/ai/system-prompt.ts) now accepts an optional `recentFeedback: RecentFeedback | null` arg and renders a `RECENT_FEEDBACK` block **only for `kind: 'ask'`** — onboarding and checkin still get the clean coverage-driven prompt they had.

[app/api/ask/chat/route.ts](../app/api/ask/chat/route.ts) wires the call in parallel with vocabulary / coverage / understanding fetches so it doesn't add a sequential round trip.

**Alternatives:**
- Surface the full `hack_interactions` table to the model (cost + noise; the model doesn't need IDs).
- Compute the digest in Postgres via a view (premature — two `.select()` calls are cheap enough).
- Bake the same block into onboarding/checkin (premature — onboarding has no history, checkin already has its own continuity block).

**Consequences:** Ask queries are visibly biased toward tags the user *liked* and away from tags they *dismissed*. We accept the 14-day lookback as a hard window — older signal is implicitly carried by `profile_understanding.summary`. If too few interactions exist, both lists return empty and the block reads "(none)"; the model is instructed to treat that as no constraint.

---

## 2026-05-27 — App shell via `(app)` route group + `AppHeader`

**Context:** The four top-level feeds (Suggested / Peers / Communities / Explore) plus Challenges + secondary pages (Profile, Settings, Saved, Messages, Learning path) all share the same chrome — a sticky top header on the left and the global AskBar on the bottom. The marketing landing, login, `/onboarding`, `/checkin`, and `/auth/*` flows intentionally own the full viewport and must NOT show that chrome. Per-page duplication of the layout would drift instantly.

**Decision:** Wrap every in-app page in a Next.js [route group](https://nextjs.org/docs/app/building-your-application/routing/route-groups) at **`app/(app)/`**. The group's [`layout.tsx`](../app/(app)/layout.tsx) is the single mount point for **`<AppHeader />`** ([components/shell/app-header.tsx](../components/shell/app-header.tsx)) and applies the shell-only background (**`bg-zinc-50`**). The route group has **zero URL impact** — `/for-you`, `/profile`, `/settings`, etc. stay flat. Pages outside the group (`app/page.tsx`, `app/login/`, `app/onboarding/`, `app/checkin/`, `app/auth/*`) remain untouched and keep their full-viewport behaviour.

The header is composed of focused leaves under **`components/shell/`**:

- **`brand-mark.tsx`** — circular logo (lucide `Wind` placeholder, swap for real SVG later).
- **`primary-nav.tsx`** — client; uses `usePathname()` for the underlined active state. Exports `PRIMARY_NAV_ITEMS` + `PRIMARY_NAV_TRAILING` (the visual divider before Challenges matches the wireframe).
- **`secondary-menu.tsx`** — server; Create CTA (label flips to "Become a creator" when `!isCreator(profile)`), favorites button with badge, points pill (creator-only), avatar link, hamburger trigger.
- **`hamburger-menu.tsx`** — client; **`@base-ui/react/menu`** (no shadcn `dropdown-menu` install needed — the project already depends on Base UI). On `< md` viewports it surfaces the primary nav items too, so mobile users still reach every page.
- **`page-header.tsx`** + **`empty-state.tsx`** — small primitives every shell page reuses for consistent H1 / description / EmptyState rendering.

**Auth gate** lives in the route-group layout: `getViewer()` returns `null` → `redirect('/login')`. **Onboarding gate** lives **per-page** via [`requireOnboarded()`](../lib/auth/onboarding.ts), so **`/profile`** and **`/settings`** stay reachable even before onboarding completes (lets a user recover or delete their account at any time).

**Alternatives:** Per-page header duplication (drifts immediately); a top-level `app/layout.tsx` that branches on `usePathname()` (forces every page that needs full-viewport — login, onboarding — to be an exception); nested layouts under `app/dashboard/` (lock the feeds under a `/dashboard/...` prefix we don't want).

**Consequences:** One mount point for the chrome. Adding a new in-app page is a single file under `app/(app)/.../page.tsx` — header, AskBar, background, gates are inherited. Pages outside the group (login / coach flows) stay isolated. The AskBar's `HIDDEN_PATHS` list is the only other place that needs to know about full-viewport routes — keep that list in sync.

---

## 2026-05-27 — `/for-you` is the post-login landing; relabeled "Suggested" in the nav

**Context:** [ADR 2026-05-27 — `/for-you` is the personal feed URL] chose the URL for the personalised feed. The wireframe relabels that tab to **"Suggested"** and makes it the post-login home. We need authed users to land there from `/`, `/login`, and (for legacy bookmarks) `/dashboard`. The URL itself stays — moving it would break the existing redirect from `finish_onboarding`, the route's RLS-safe data layer, and a stable href the AskBar's renderers point at.

**Decision:** Keep the URL **`/for-you`** unchanged. In **`components/shell/primary-nav.tsx`**, render its label as **"Suggested"**. Update [`lib/supabase/proxy.ts`](../lib/supabase/proxy.ts) so the authed-on-`/login` redirect target is `/for-you` (was `/dashboard`). Update [`app/page.tsx`](../app/page.tsx) to server-redirect authed users to `/for-you`. `/dashboard` becomes a thin `redirect('/profile')` page for legacy bookmarks (see the next ADR).

**Alternatives:** Move the page to `/` (forces the marketing landing into a conditional + breaks ADR 2026-05-27); use `/suggested` and retire `/for-you` (rewrites finish-onboarding redirect, AskBar links, all `revalidatePath` calls in `app/for-you/actions.ts`).

**Consequences:** No URL churn, no broken bookmarks except `/dashboard` which is handled. UI vocabulary becomes "Suggested" (matches the wireframe and the user's mental model); the codebase keeps "For You" in route paths / file names / `revalidatePath` calls for internal consistency. **Extends** ADR 2026-05-27 — `/for-you` is the personal feed URL — it didn't change, just got a friendlier label.

---

## 2026-05-27 — `/dashboard` retired in favour of `/profile` + `/settings`

**Context:** The original [`/dashboard`](../app/dashboard/page.tsx) page mixed three responsibilities — profile read-out (avatar, name, email, locale), session management (sign out), and the danger zone (`delete_my_account()`). It also served as both "post-login landing" and "where I look at my own data," which the new app shell separates cleanly: the landing is the feed (Suggested), and the secondary menu (avatar → `/profile`, hamburger → `/settings`) is the entry into account management.

**Decision:** Replace `app/dashboard/page.tsx` with a single-line **`redirect('/profile')`** server component (keeps legacy bookmarks alive). Delete `app/dashboard/layout.tsx` (auth check now lives in the `(app)` route-group layout). Move `app/dashboard/delete-account-button.tsx` → [`components/settings/delete-account-button.tsx`](../components/settings/delete-account-button.tsx) (unchanged code, new home). Split the old page's content:

- **`/profile`** — read-only: avatar, name, email, sector, role, locale, points-when-creator, LinkedIn URL, and the rolling **`profile_understanding.summary`**. CTAs link to `/onboarding` and `/checkin` for updating signals.
- **`/settings`** — actions: profile-signal links, sign-out, danger-zone delete.

Neither calls `requireOnboarded()` — a brand-new user must be able to delete or reach onboarding from these pages even if they abandoned the coach mid-flow.

**Alternatives:** Keep `/dashboard` and put the rest of the chrome around it (perpetuates the mixed-responsibility page); rename to `/account` (loses the existing user mental model from the wireframe — "avatar = profile"); merge profile + settings into one long page (forces account-recovery scrolling past read-only data).

**Consequences:** Two thin, single-purpose pages. The proxy's protected-prefix list adds `/profile` and `/settings`; everything else stays. `signOut()` continues to redirect to `/` (anon there sees the landing, no loop).

---

## 2026-05-27 — Force light theme via `next-themes` `forcedTheme="light"`

**Context:** The product spec is white-only — no dark mode toggle, no system preference following. The CSS in [`app/globals.css`](../app/globals.css) already defines dark-mode variables under `.dark`, but `next-themes` was wired with `defaultTheme="system" enableSystem`, so users on dark-mode OS were silently flipped.

**Decision:** Change [`app/providers.tsx`](../app/providers.tsx) `<ThemeProvider>` to `forcedTheme="light"`. `next-themes` then never applies the `.dark` class regardless of system preference or stored cookie. Keep the dark CSS variables in `globals.css` untouched — removal would be its own ADR (and the cost of carrying them is zero).

**Alternatives:** Strip `next-themes` entirely (bigger blast radius — multiple components still import the package indirectly via shadcn); delete the `.dark { … }` block in globals.css (acceptable but loses the option to add a toggle later without re-deriving the tokens); manually set `class="light"` on `<html>` (works but ignores `next-themes`'s `disableTransitionOnChange` smoothing).

**Consequences:** Single source of truth: the `light` token set in `:root`. Adding dark later is a one-line config change — nothing else moves.

---

## 2026-05-27 — Primary nav adds "Explore" = cross-org / public hacks

**Context:** The wireframe introduces a fifth top-level tab — **Explore** — alongside Suggested / Peers / Communities / Challenges. The original IA in [docs/vision.md](vision.md) listed only four. The product's long-term vision is **cross-organisation peer learning** (a marketer at Org A learning from a marketer at Org B), which today's B2B-first launch defers. Explore is the first surface where that cross-org content can land.

**Decision:** Add a top-level **`/explore`** route with the label **"Explore"** in `PRIMARY_NAV_ITEMS`. Semantically: hacks **across organisations**, scoped to platform-public content (`source = curated | external` plus, later, user hacks explicitly marked public). For MVP the page renders an EmptyState — the corpus is too small to surface anything meaningful, and the org-scoping schema deltas (`profiles.organization_id`, public/private hack visibility) are still pending. The route exists so the nav lights up and the future feed has a stable URL.

**Alternatives:** Defer Explore until cross-org schema lands (forces a nav reshuffle later — five-tab muscle memory broken); fold Explore into Communities (conflates "topics I opted into" with "discover beyond my org"); call it "Public" (correct but less inviting copy).

**Consequences:** [docs/glossary.md](glossary.md) adds an **Explore** entry. [docs/data-model.md](data-model.md) notes that the visibility filter on Explore depends on the same pending `organization_id` work as Office peers — the two feeds will gain real content as part of the same migration wave.

---

## 2026-05-27 — Ask coach pivots to `/challenges/new` on zero-result hacks; never off-platform

**Context:** When the Ask coach's `find_hacks` tool returned zero rows, the model had no defined on-platform escape hatch. In testing it suggested off-platform search ("kijk op Twitter") — churn fuel that undermines the product loop. Challenges are already the designed answer to "no hack exists yet — ask peers" (`docs/vision.md` §Challenges; `challenges` + `challenge_tags` in `learning_schema.sql`).

**Decision:**
1. Add **`suggest_challenge`** to the Ask tool branch ([`lib/ai/tools.ts`](../lib/ai/tools.ts)) — **no DB write**. Returns `{ href: '/challenges/new?title=…&body=…&tag=…' }` so the user lands on a real form with pre-filled fields.
2. Tighten ASK MODE in [`lib/ai/system-prompt.ts`](../lib/ai/system-prompt.ts): forbid off-platform alternatives; on second zero (or user decline) call `suggest_challenge` and narrate in one sentence.
3. Render the tool output as a CTA card ([`suggest-challenge-renderer.tsx`](../components/feed/suggest-challenge-renderer.tsx)) wired into the Ask overlay's `toolRenderers`. The CTA runs a **GSAP exit** (fade + slide down) on the overlay before `router.push` so the destination page is not hidden behind the modal ([`ask-overlay.tsx`](../components/feed/ask-overlay.tsx) + `AskNavigateProvider` in the renderer).
4. Ship partial **`/challenges`** MVP: list (mine + open peers), `/challenges/new` form + `createChallenge` Server Action, `/challenges/[id]` read-only detail. Replies (`challenge_comments`) deferred.

**Alternatives:** Auto-insert challenge with undo (risky — posts without explicit consent); pure-prose link in assistant text (no clickable card, model might still drift off-platform); coach creates the row directly via a `create_challenge` tool (skips edit-before-post).

**Consequences:** Challenge writes stay user-consented via the form. The coach has a clean, on-platform loop when the corpus is thin. `/challenges` is no longer an EmptyState stub — but comments/praise/org-scoping remain in the B2B-MVP migration wave.

---

## 2026-05-27 — Post card design system; “Post” as UI term (dummy data interim)

**Context:** The Suggested feed needed a wireframe-faithful post card (post type + time estimate, structured title with tool icon, author block, social metrics, peer-completion footer, favorite heart) before the B2B schema deltas (`hacks.post_type`, structured title columns, praise/points ledger, org affiliation) are migrated. Product vocabulary is shifting from “hack” to **post** in UI copy and code.

**Decision:**
1. **UI/code term:** **`Post`** / **`PostCard`** / **`components/post/`** — database table names stay **`hacks`** / **`hack_*`** until a dedicated rename migration.
2. **Interim data:** Typed dummy rows in [`lib/dummy/posts.ts`](../lib/dummy/posts.ts); **`/for-you`** renders these instead of `get_recommended_hacks()` until real rows can satisfy the card shape.
3. **Design tokens:** Add semantic **`--favorite`** / **`--points`** CSS variables in [`app/globals.css`](../app/globals.css) (mapped to Tailwind `bg-favorite`, `bg-points`, etc.).
4. **Primitives:** Ship shadcn-style [`components/ui/badge.tsx`](../components/ui/badge.tsx) for post-type and duration pills.
5. **Tool icons:** Add **`simple-icons`** dependency; [`components/post/tool-icon.tsx`](../components/post/tool-icon.tsx) maps `ToolSlug` → icon (package icons where available; minimal custom paths for brands absent from the registry, e.g. Photoshop / ChatGPT / Excel).
6. **Favorite affordance:** Card heart is **visual-only by default** (`PostFavoriteButton` accepts optional `onToggle`) — wiring to `toggleSave(hackId)` is deferred because dummy IDs would FK-violate `hack_interactions.hack_id`.
7. **Detail stub:** [`app/(app)/hacks/[id]/page.tsx`](../app/(app)/hacks/[id]/page.tsx) resolves dummy posts + `generateMetadata`; full markdown/comments/praise UI deferred.
8. **`HackViewTracker`** stays off dummy cards (`enableViewTracking` defaults `false` on `PostCard`).

**Alternatives:** Land full SQL migration first (blocked scope); keep legacy minimal `HackCard` (doesn't match wireframe); rename DB tables now (high churn across RPCs/RLS).

**Consequences:** `/for-you` is visually testable end-to-end. Re-wiring to Supabase is a follow-up once schema deltas land. Legacy [`components/feed/hack-card-actions.tsx`](../components/feed/hack-card-actions.tsx) remains for any unmigrated surfaces.

---

## 2026-05-28 — Dummy posts seeded as curated `hacks`; cookie favorite layer retired

**Context:** The prior ADR ("Post card design system; 'Post' as UI term (dummy data interim)") shipped `<PostCard />` against TypeScript-only dummies and a follow-up hooked the favorite heart to an `httpOnly` cookie so the feature was demonstrable end-to-end. Two seams stayed broken: (a) `find_hacks` / `get_recommended_hacks` / Ask coach all query the real `public.hacks` table, so the dummy posts were invisible to search and recommendations; (b) the cookie meant favorites lived outside RLS, didn't survive a sign-out, and accumulated a parallel source of truth.

**Decision:**
1. **Seed dummies into Supabase.** [`supabase/08_seed_dummy_posts.sql`](../supabase/08_seed_dummy_posts.sql) idempotently inserts 10 curated rows (`source='curated'`, `author_id=null`, `status='published'`) with **hardcoded UUIDs** (`aaaaaaaa-0001-0001-0001-00000000000N`) and links each to one sector tag + one tool tag in `public.hack_tags`. Re-runs upsert title/summary/body and never duplicate tag links.
2. **TS metadata mirrors SQL by id.** [`lib/dummy/posts.ts`](../lib/dummy/posts.ts) now exposes **`POST_META_BY_ID`** (keyed by the same UUIDs) + **`getPostMeta(id)`** — every UI page reads core data (`id`, `title`, `status`) from `public.hacks` and decorates with TS metadata (`postType`, `estimatedMinutes`, structured title parts, author block, peers, metrics). The B2B-MVP migration (post_type / goal / structured title columns / praise ledger / org affiliation) is still pending — this split is the bridge.
3. **Tool set rebuilt to product priorities.** `ToolSlug` shrinks to `photoshop | figma | framer | notion | zoom | cursor | claude` (drops `chatgpt / googlegemini / microsoftexcel / linear / googlesheets`). Sector spread becomes design (4) / operations (3) / engineering (2) / marketing (1); users in `finance / sales / hr / product / other` rely on the new recent-published fallback in `/for-you` until matching content lands.
4. **Favorites move to `hack_interactions`.** [`app/(app)/posts/actions.ts`](../app/(app)/posts/actions.ts) `togglePostFavorite` is now a thin wrapper over the same insert/delete pattern as `app/for-you/actions.ts` `toggleSave` — same `kind='saved'` table, RLS scoped to `auth.uid()`, FK to `public.hacks` so stale ids fail loudly. The cookie file `lib/posts/saved-posts-cookie.ts` and its callers (`/for-you`, `/saved`, `/hacks/[id]`, `app/(app)/layout.tsx`) are removed; the layout's saved-count is now `getSavedCount(userId)` only.
5. **`/for-you` adds a recent-published fallback.** When `get_recommended_hacks(20)` returns zero overlap, the page falls back to the 20 newest published hacks so new users (no sector overlap yet) never see an empty feed.
6. **View tracking is now FK-safe.** `PostCard` enables `<HackViewTracker />` on the `/for-you` grid; the v2 recommendation decay finally sees real `viewed` rows for these posts.

**Supersedes (partial):** "2026-05-27 — Post card design system; 'Post' as UI term (dummy data interim)" — the dummy data is no longer purely TS, and the favorite cookie is gone. UI vocabulary ("Post" in code, "hack" in DB) and the component layout decisions still stand.

**Alternatives:** Land the full `hacks` migration first (blocks the sprint); generate UUIDs at SQL run time (loses the SQL ↔ TS mirror); keep the cookie store as a guest-mode affordance (unnecessary — every authenticated route now writes to DB).

**Consequences:** End-to-end is real: heart on the card persists in DB, the header badge reads from `hack_interactions`, `/saved` lists what you saved across sessions, and AskBar Search / Ask coach both surface the seeded posts via `find_hacks`. The hardcoded UUID convention establishes a pattern other curated content can follow until the rename migration. New non-design/ops/eng users see a thinner feed until their sectors are populated — the fallback is the cheap insurance policy. Legacy [`components/feed/hack-card-actions.tsx`](../components/feed/hack-card-actions.tsx) is still in the tree as an unmigrated surface.
