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

## Next (implement now → user-visible MVP)

- **`/onboarding`** — pick **`sector`** + capture **1–3 frustrations** with **topic/skill/tool** tag picks (**3–5 tags** guideline)
- **`/hacks`** list bound to **`get_recommended_hacks(limit)`**
- **`/hacks/[id]`** markdown body render + CTAs (**save / helpful / completed** → **`hack_interactions`** inserts / upserts UX)
- **`/checkin`** — weekly **`body`** + tag multi-select enforcing **≤1 row per `(user_id, week_start)`**
- **`/admin/hacks`** (route group) gated by **`profiles.role ∈ {curator,admin}`** for curated authoring
- **Run** **`learning_schema.sql`** in Supabase (if not already) + unlock optional **seed** block for baseline tags
- **`npx supabase gen types typescript … > lib/database.types.ts`** wire into clients
- **Polish UX / empty states / loading** for dashboards once data flows exist

## Later (defer intentionally)

- Activate **`credit_ledger`** + surfaced balances + creator rewards
- **Comments / reactions / follows** (+ moderation queue)
- **Real ESCO ingest** filling **`tags.esco_uri`** + hierarchical browse
- **`pgvector` embeddings** hybrid rank once content volume justifies infra cost
- **Separate Supabase project** strictly for prod + migration discipline
- **Custom domain & marketing site** splits if brand grows beyond single deployment
- **Automated testing + CI** (Playwright/component tests once flows stabilise)
