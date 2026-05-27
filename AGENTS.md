# Slimmerbezig — AI agents & collaborators

## Product (read first)

**Slimmerbezig** is a **B2B SaaS micro-learning** platform. Companies roll it out to their teams; users see **AI hacks** matched to their **sector**, **frustrations**, **weekly check-ins**, and **organisation**. Hacks vary in effort (`post_type`: **bite / recipe / guide / external link**) and carry a structured **Goal × Tool × AI-capability** taxonomy. Curated content + colleague-authored hacks + curator-approved external links. Long-term vision: **cross-organisation peer-learning** (people learning from same-field peers at other companies) — deferred until intra-org loops are sticky. Top-level pages: **For You / Communities / Office peers / Challenges**. This repo is the Next.js web app + SQL schema for Supabase.

Operational setup (env, Vercel, LinkedIn): **[README.md](README.md)**  
Product / architecture / vocabulary: **[docs/](docs/)** (always keep these in sync when behaviour changes).

## Stack

- **Next.js 16** App Router + TypeScript + ESLint
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** Postgres + Auth (LinkedIn OIDC) via **`@supabase/ssr`**
- **Vercel** deploy from **GitHub `main`**
- Env: **[lib/env.ts](lib/env.ts)** (Zod-validated `NEXT_PUBLIC_*`), plus **`lib/env.server.ts`** for **`OPENAI_API_KEY`** / coach flags (never import server env from clients).

## Animation stack

Front-end motion is centred on **`gsap`** (+ **`ScrollTrigger`**, **`CustomEase`**) and **`lenis`** (smooth scroll), installed from npm — registered once via **[lib/anim/registerGsap.ts](lib/anim/registerGsap.ts)**, Lenis bridged to the GSAP ticker in **[components/anim/SmoothScrollProvider.tsx](components/anim/SmoothScrollProvider.tsx)**, and lightweight route enter motion in **`app/template.tsx`** (prefer this over SPA-style routers that bypass Next).

**Working rule:** before adding other animation libraries — or implementing page transitions, scroll-linked effects, or hover/state motion — **check whether GSAP first** (often with ScrollTrigger / CustomEase). Use **Lenis** for smooth scrolling and keep `ScrollTrigger.refresh()` in mind after layout-altering navigation (handled in `template`). **`@barba/core` is not used** — it conflicts with the App Router, `proxy.ts`, and Server Actions.

## First-read order (new session)

1. This file (**AGENTS.md**)
2. [docs/vision.md](docs/vision.md)
3. [docs/data-model.md](docs/data-model.md) + the relevant `supabase/*.sql` files it links
4. Skim [docs/decisions.md](docs/decisions.md) (what we already decided and why)
5. [docs/roadmap.md](docs/roadmap.md) (what’s next)
6. Lock vocabulary: [docs/glossary.md](docs/glossary.md)

## Do / Don’t

### Do

- Use root **[proxy.ts](proxy.ts)** (Next 16 convention), not `middleware.ts` — having both breaks the build.
- Before changing Next APIs or file conventions, read **`node_modules/next/dist/docs/`** (this project is on a recent Next with breaking changes vs older training data).
- Keep **[supabase/schema.sql](supabase/schema.sql)** focused on **auth + `profiles` baseline**; add learning tables in **[supabase/learning_schema.sql](supabase/learning_schema.sql)** or a new migration file — don’t mix concerns without reason.
- Prefer **Server Actions** or **POST** for side effects (e.g. sign-out is in **[app/auth/actions.ts](app/auth/actions.ts)**).
- After meaningful product or technical choices, append an ADR to **[docs/decisions.md](docs/decisions.md)**.

### Don’t

- Don’t run **destructive DDL** (`DROP TABLE`, irreversible `ALTER`) unless the human explicitly asked.
- Don’t commit secrets: **`.env*`** is gitignored — never paste keys into docs or commits.
- Don’t add `middleware.ts` next to `proxy.ts`.
- Don’t expose sign-out as a plain **GET** `<Link>` (prefetch / CSRF risk).
- Don’t leak data across **organisations**: every list/feed query must filter by the current user’s `organization_id` (or be explicitly platform-curated / public).
- Don’t let non-curators insert hacks with `source = 'external'` — that path is curator/admin only.

## Maintenance (keep docs honest)

| When… | Update… |
|-------|---------|
| Product direction or MVP scope shifts | [docs/vision.md](docs/vision.md), [docs/roadmap.md](docs/roadmap.md) |
| You choose between options | [docs/decisions.md](docs/decisions.md) (append ADR) |
| Tables, RLS, or RPCs change | [docs/data-model.md](docs/data-model.md) + the SQL file |
| You introduce a new domain term | [docs/glossary.md](docs/glossary.md) |
| New env vars or deploy steps | [README.md](README.md) |
| New “always” rules for coding agents | **This file** |

---

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## After the Next.js block

- **Auth/session refresh:** [lib/supabase/proxy.ts](lib/supabase/proxy.ts) + [proxy.ts](proxy.ts)
- **Browser Supabase client:** [lib/supabase/client.ts](lib/supabase/client.ts)
- **Server Supabase client:** [lib/supabase/server.ts](lib/supabase/server.ts)
- **OAuth callback (Vercel-friendly host):** [app/auth/callback/route.ts](app/auth/callback/route.ts)
