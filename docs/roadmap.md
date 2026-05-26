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

## Next (implement now → B2B-MVP)

### Schema (new migration on top of `learning_schema.sql`)

- **`organizations`** table + **`profiles.organization_id`** (multitenant); seat invites
- **`hacks.post_type`** enum **`bite | recipe | guide | external`**
- **`hacks.goal`** enum **`automate | analyse | generate | organise | communicate | learn | decide`**
- **`tags.kind`** extend with **`capability`**; seed baseline tools + capabilities
- **`hacks.source`** extend with **`external`**; add **`source_url`**, **`external_author`**; curator-only RLS
- Publish-time check: published hacks have **≥1 tool tag** and **≥1 capability tag**
- Org-scoped RLS for hacks / challenges / feed visibility
- **`challenge_comments`** (with optional **`hack_id`** + **`is_self_promotion`**)
- **`hack_praises`** + **`comment_praises`** (one praise per user/target)
- **Points ledger** (append-only) — slim promotion of `credit_ledger`
- `npx supabase gen types typescript … > lib/database.types.ts` and wire into clients

### Pages / IA

- **`/feed`** = **For You** — recommended hacks for the signed-in user (`get_recommended_hacks` + org filter + post-type chips)
- **`/communities`** — sector / topic / tool clusters with hack lists
- **`/office`** — **Office peers** feed (same `organization_id`)
- **`/challenges`** — list + detail; post comment, attach hack, self-promote with disclosure
- **`/onboarding`** — sector + 1–3 frustrations + 3–5 tags (Goal/Tool/Capability hints)
- **`/hacks/[id]`** — markdown render + **save/helpful/completed/praise** CTAs
- **`/checkin`** — weekly body + tag multi-select (≤1 row per `(user_id, week_start)`)
- **`/admin/hacks`** — curator/admin authoring including **external** link curation queue
- Org admin surface: invite seats, manage members, set defaults

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
