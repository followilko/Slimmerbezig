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
