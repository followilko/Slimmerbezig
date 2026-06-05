# Roadmap

Quick orientation: visions and trade-offs live in [vision.md](vision.md) & [decisions.md](decisions.md). Operational setup stays in **[README](../README.md)**.

## Done (foundations shipped in repo)

- Next.js App Router scaffold + ESLint baseline
- Tailwind / shadcn/ui shell
- Supabase SSR clients + root **`proxy.ts`** session refresh
- LinkedIn **OIDC** sign-in (`linkedin_oidc`) + `/auth/callback` with forward headers for Vercel
- Protected **`/dashboard`** with profile hydration
- Zod-validated **`NEXT_PUBLIC_*`** env ([`lib/env.ts`](../lib/env.ts))
- SQL split into **`schema.sql`** (profiles) + **`learning_schema.sql`** (full MVP DDL + RLS + RPC)
- **Future sketches** consolidated in **`future_schema.sql`** (comment-only)
- Vercel production deploy **`slimmerbezig.vercel.app`** path validated in thread
- **Project brain docs** (**`docs/`**) + expanded **`AGENTS.md`**
- **AI coach MVP**: OpenAI **`gpt-4o-mini`** streaming via **`/api/onboarding/chat`**, **`/onboarding`** + **`/checkin`** UIs (**`AI SDK 6`** + **`@ai-sdk/react` `useChat`**), tooling to write frustrations/interests/`profile_understanding`, optional **`AI_CHAT_STUB_TOOLS`**
- **`supabase/ai_chat_schema.sql`** (transcripts + interests + curator **`tag_suggestions`** queue + **`get_recommended_hacks`** union **`user_interests`**)
- **Track A — Onboarding v2**: 3-question cap, coverage-driven steering (`lib/ai/coverage.ts`), `CAPTURED_SO_FAR` / `STILL_NEEDED` in system prompt, server-side `finish_onboarding` / `finish_checkin` guard, auto-greet via seeded assistant message, `record_linkedin` tool + `profiles.linkedin_url` column (`supabase/03_onboarding_extras.sql`), `/for-you` placeholder feed with onboarding guard + redirect-on-finish
- **Self-serve profile delete**: `delete_my_account()` RPC (`supabase/04_delete_account.sql`) + Dashboard two-step confirm + `deleteAccount` server action — full test reset without service role
- **App shell + page structure** (ADRs 2026-05-27 — App shell route group, /for-you as landing, /dashboard retired, light-only theme, Explore tab): `app/(app)/layout.tsx` route group hosts every in-app page, sticky **`<AppHeader />`** ([components/shell/app-header.tsx](../components/shell/app-header.tsx)) with primary nav (**Suggested / Peers / Communities / Explore · Challenges**) + secondary menu (Create CTA, favorites + badge, creator-only points pill, avatar, hamburger via **`@base-ui/react/menu`**). AskBar restyled to the wireframe pill (icon-only Search/Ask toggle, circular submit). Theme forced to `light`. Stub pages scaffolded for `/office`, `/communities`, `/explore`, `/challenges`, `/saved`, `/messages`, `/learning-path`, `/become-a-creator`, `/hacks/new`. **`/dashboard`** is now a thin redirect to **`/profile`**; profile + settings split into [`app/(app)/profile/page.tsx`](../app/(app)/profile/page.tsx) and [`app/(app)/settings/page.tsx`](../app/(app)/settings/page.tsx). Proxy + landing redirect authed users to `/for-you`. Per-page **`requireOnboarded()`** ([lib/auth/onboarding.ts](../lib/auth/onboarding.ts)) gate; `/profile` + `/settings` deliberately exempt.
- **Post card surface end-to-end** (ADR 2026-05-28 — Dummy posts seeded as curated hacks): wireframe-faithful **`<PostCard />`** ([`components/post/`](../components/post/)) — post-type + minutes pill, structured "how to [action] in [Tool]" title with [`<ToolIcon />`](../components/post/tool-icon.tsx) (`simple-icons` for figma/framer/notion/zoom/cursor/claude; custom path for photoshop), author block with `relativeTime`, social row, peer-completion footer, optimistic favorite heart. 10 curated rows seeded idempotently via [`supabase/08_seed_dummy_posts.sql`](../supabase/08_seed_dummy_posts.sql) with hardcoded UUIDs that mirror **`POST_META_BY_ID`** in [`lib/dummy/posts.ts`](../lib/dummy/posts.ts). `/for-you` reads `get_recommended_hacks` v2 with a recent-published fallback for users without sector overlap; `/saved` queries `hack_interactions`; `/hacks/[id]` merges DB + meta. Favorites write to `hack_interactions` (cookie store retired); header badge reads `getSavedCount(userId)` only. Search and Ask coach surface the seeded posts via existing `find_hacks`.

### Schema (new migration on top of `learning_schema.sql`)

- **`organizations`** table + **`profiles.organization_id`** (multitenant); seat invites
- **`hacks.post_type`** enum **`bite | recipe | guide | external`**
- **`hacks.goal`** enum **`automate | analyse | generate | organise | communicate | learn | decide`**
- **`tags.kind` `capability` + onboarding columns** (**`profiles.onboarded_at`**) — migrated in **`ai_chat_schema.sql`**; still need seed discipline + curator workflows
- **`hacks.source`** extend with **`external`**; add **`source_url`**, **`external_author`**; curator-only RLS
- Publish-time check: published hacks have **≥1 tool tag** and **≥1 capability tag**
- Org-scoped RLS for hacks / challenges / feed visibility
- **`challenge_comments`** (with optional **`hack_id`** + **`is_self_promotion`**)
- **`hack_praises`** + **`comment_praises`** (one praise per user/target)
- **Points ledger** (append-only) — slim promotion of `credit_ledger`
- `npx supabase gen types typescript … > lib/database.types.ts` and wire into clients

### Pages / IA

Shell + stubs are scaffolded (see "Done"). Content for each surface still needs to land:

- **`/for-you`** ("Suggested") — shipped; full-viewport **depth tiles** GSAP carousel of six recommended **`PostCard`**s ([`components/feed/suggested-depth-feed.tsx`](../components/feed/suggested-depth-feed.tsx)); falls back to grid when `< 2` items. **`/explore`** keeps the scannable grid. Card metrics (likes/comments/points) remain TS-only until praise/points and comments schemas land.
- **`/communities`** — sector / topic / tool clusters with hack lists. Shell-stubbed.
- **`/office`** ("Peers") — same `organization_id` feed. Shell-stubbed; blocked on `organizations` migration.
- **`/explore`** — cross-org / public hacks. Shell-stubbed; blocked on cross-org visibility schema + corpus.
- **`/challenges`** — **partial MVP shipped:** list (mine + open peers), [`/challenges/new`](../app/(app)/challenges/new/page.tsx) create form, [`/challenges/[id]`](../app/(app)/challenges/[id]/page.tsx) detail. Ask coach deep-links here via `suggest_challenge` when `find_hacks` returns zero. Comments, hack-links, and praise still pending B2B-MVP migration.
- **`/onboarding`** — 3-question coach: Identity / Friction / Toolkit (coverage-driven, ADR 2026-05-27)
- **`/hacks/[id]`** — markdown render + **save/helpful/completed/praise** CTAs
- **`/hacks/new`** — creator-gated compose flow. Shell-stubbed; redirects non-creators to `/become-a-creator`.
- **`/checkin`** — weekly body + tag multi-select (≤1 row per `(user_id, week_start)`)
- **`/saved`** — shipped; DB-backed `PostCard` grid joined to `hack_interactions WHERE kind='saved'`.
- **`/messages`**, **`/learning-path`** — hamburger destinations. Shell-stubbed.
- **`/profile`** + **`/settings`** — replace the old `/dashboard`. Profile is read-only; settings hosts sign-out + delete account.
- **`/admin/hacks`** — curator/admin authoring including **external** link curation queue
- Org admin surface: invite seats, manage members, set defaults

### Track B — Continuous Ask / Search

- **B1 — Shipped:** Postgres FTS on hacks ([`supabase/06_hack_search.sql`](../supabase/06_hack_search.sql)) — `hacks.search_tsv` (title=A / summary=B / body_md=C) + GIN + `find_hacks(query, limit)` RPC. Smoke-test seam at [`app/api/search/route.ts`](../app/api/search/route.ts).
- **B2 — Shipped:** Global **AskBar** component ([`components/feed/ask-bar.tsx`](../components/feed/ask-bar.tsx)) mounted in [`app/providers.tsx`](../app/providers.tsx), fixed bottom-center, minimizes on scroll (GSAP + Lenis bridge, per AGENTS animation rule); search dropdown via [`ask-search-results.tsx`](../components/feed/ask-search-results.tsx); hidden on `/login`, `/onboarding`, `/checkin`, `/auth/*`; `⌘K` focuses input.
- **B3 — Shipped:** `chat_sessions.kind = 'ask'` rolling session ([`supabase/07_ask_session.sql`](../supabase/07_ask_session.sql)) — one open row per user, never closes. Existing partial-unique index enforces "one open per kind"; transcript trimmed to last 100 messages in the route (ADR 2026-05-27 — Ask is a rolling, never-closing chat session).
- **B4 — Shipped:** [`app/api/ask/chat/route.ts`](../app/api/ask/chat/route.ts) + new `find_hacks` AI tool branch in [`lib/ai/tools.ts`](../lib/ai/tools.ts); ASK MODE section in [`lib/ai/system-prompt.ts`](../lib/ai/system-prompt.ts).
- **B5 — Shipped:** Ask overlay ([`components/feed/ask-overlay.tsx`](../components/feed/ask-overlay.tsx)) hosts the existing `<CoachChat>` with `find_hacks` results rendered as cards via [`find-hacks-renderer.tsx`](../components/feed/find-hacks-renderer.tsx) — `<CoachChat>` now accepts `autoSendUserText` + `toolRenderers` + `hideSidebar` + `compact` props.
- **B6 — Shipped:** Zero-result Ask pivot to Challenges — `suggest_challenge` tool (no DB write; deep-link to `/challenges/new`) + [`suggest-challenge-renderer.tsx`](../components/feed/suggest-challenge-renderer.tsx). ASK MODE prompt forbids off-platform redirects (Twitter, Google, etc.). CTA click GSAP-exits the Ask overlay before navigation. Partial `/challenges` MVP: list, create, detail (comments deferred).
- **B7 — Shipped:** `find_hacks` v2 ([`supabase/09_find_hacks_v2.sql`](../supabase/09_find_hacks_v2.sql)) — tier-1 tag-overlap + tier-2 strict FTS + tier-3 gated OR fallback; recent-published only for empty / all-stop-word queries. Ask prompt: filler-word hygiene, immediate auto-retry on zero, narrow when `hacks.length >= 8`. Renderer caps visible cards at 5 with "+ N meer" footer. See ADR 2026-05-28 — `find_hacks` v2.

### Track C — Implicit signals

- **C1 — Shipped:** `get_recommended_hacks` **v2** ([`supabase/05_recommendation_v2.sql`](../supabase/05_recommendation_v2.sql)) layers helpful-boost (+2), viewed-decay (−0.5), completed-decay (−1.0), and a hard `not_helpful` exclude on top of v1 tag overlap
- **C2 — Shipped:** `/for-you` thumbs / save UI ([`components/feed/hack-card-actions.tsx`](../components/feed/hack-card-actions.tsx)) + server actions ([`app/for-you/actions.ts`](../app/for-you/actions.ts)) with optimistic toggles + `revalidatePath`
- **C2.1 — Shipped:** Auto-`viewed` via IntersectionObserver — [`components/feed/hack-view-tracker.tsx`](../components/feed/hack-view-tracker.tsx) drops a tiny observer alongside each `<HackCard>`; 2s of ≥50% viewport → `recordView` server action upserts `hack_interactions(kind='viewed')`. Idempotent via the (user_id, hack_id, kind) PK + a `23505`-as-success shortcut. No `revalidatePath` — silent signal.
- **C3 — Shipped:** Last-14d feedback digest fed into the Ask system prompt — [`lib/ai/recent-feedback.ts`](../lib/ai/recent-feedback.ts) returns the union of tag slugs from `helpful` / `not_helpful` interactions + saved-count. Rendered as a `RECENT_FEEDBACK` block only for `kind: 'ask'`; wired through [`app/api/ask/chat/route.ts`](../app/api/ask/chat/route.ts) in parallel with the other prompt fetches.

## Later (defer intentionally)

- **Point → reward** redemption mechanics + creator economy
- **Cross-org peer matching** (the long-term peer-learning vision)
- SSO / SCIM for enterprise tenants
- **Comments / reactions / follows** at full social-graph depth + moderation queue
- **Real ESCO ingest** filling **`tags.esco_uri`** + hierarchical browse
- **`pgvector` embeddings** hybrid rank with Goal × Tool × Capability filters
- **Separate Supabase project** strictly for prod + migration discipline
- **Custom domain & marketing site** splits if brand grows beyond single deployment
- **Automated testing + CI** (Playwright / component tests once flows stabilise)
- Public **submit-a-link** intake (non-curators suggest external hacks for review)
