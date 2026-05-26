# Slimmerbezig — AI agents & collaborators

## Product (read first)

**Slimmerbezig** is a micro-learning platform: short **AI hacks** matched to each user’s **sector**, **frustrations**, and **weekly check-ins**. Curated content plus user-authored hacks (gated by **`profiles.role`**). This repo is the Next.js web app + SQL schema for Supabase.

Operational setup (env, Vercel, LinkedIn): **[README.md](README.md)**  
Product / architecture / vocabulary: **[docs/](docs/)** (always keep these in sync when behaviour changes).

## Stack

- **Next.js 16** App Router + TypeScript + ESLint
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** Postgres + Auth (LinkedIn OIDC) via **`@supabase/ssr`**
- **Vercel** deploy from **GitHub `main`**
- Env: **[lib/env.ts](lib/env.ts)** (Zod-validated `NEXT_PUBLIC_*`)

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
