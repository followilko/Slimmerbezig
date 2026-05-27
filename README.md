# Slimmerbezig

Minimal **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui** app with **LinkedIn OIDC** via **Supabase Auth**, a **protected dashboard**, and a **`profiles`** table in Postgres that is filled automatically on first sign-in.

## What you need on your machine

- **Node.js** 20+ (you’re on 24 — fine)
- **npm** (comes with Node)
- A **GitHub** repo, **Vercel** project, and **Supabase** project (you already have these)

Public env vars are validated at startup via [`lib/env.ts`](lib/env.ts) (**Zod**). If keys are missing (e.g. Vercel env not set), the app fails fast with a clear parse error instead of obscure cookie errors later.

## 1. Clone & install (local)

```bash
git clone <your-github-repo-url> Slimmerbezig
cd Slimmerbezig
npm install
```

If this folder is already your repo root, just run `npm install`.

Copy environment template:

```bash
cp .env.local.example .env.local
```

## 2. Supabase — API keys → `.env.local`

In Supabase: **Project Settings → API**

- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Paste both into `.env.local`.

Also add an **OpenAI API key** (server-only):

- **`OPENAI_API_KEY`** — from [platform.openai.com](https://platform.openai.com/api-keys); used by **`/api/onboarding/chat`** for the guided onboarding + weekly check-in coach. Leave unset locally only if you are not exercising those flows (the route responds **503** when missing).

Optional **`AI_CHAT_STUB_TOOLS=true`** logs tool calls instead of persisting coach rows — useful **before** step 5 (SQL) lands.

See [`.env.local.example`](.env.local.example) for placeholders.

### Run the database schema

1. Open **SQL Editor** in Supabase.
2. Paste the contents of [`supabase/schema.sql`](supabase/schema.sql) → **Run** (profiles + OAuth trigger).
3. Paste the contents of [`supabase/learning_schema.sql`](supabase/learning_schema.sql) → **Run** (sector/role extensions, hacks, tags, frustrations, weekly check-ins, challenges, interactions, RLS, `get_recommended_hacks()`).
4. **Optional**: at the bottom of [`supabase/learning_schema.sql`](supabase/learning_schema.sql), uncomment and run the **OPTIONAL SEED** block alone to insert sector + sample frustration tags (must align with curated content later).
5. Paste [`supabase/ai_chat_schema.sql`](supabase/ai_chat_schema.sql) → **Run** (coach transcripts, **`profile_understanding`**, **`user_interests`**, **`tag_suggestions`**, extends **`tags.kind`** with **`capability`**, **`profiles.onboarded_at`**, updated **`get_recommended_hacks()`**). Uncomment the OPTIONAL SEED inside that file if you want starter **tool/capability** tags.
6. Paste [`supabase/03_onboarding_extras.sql`](supabase/03_onboarding_extras.sql) → **Run** (adds **`profiles.linkedin_url`** for the onboarding coach).
7. Paste [`supabase/04_delete_account.sql`](supabase/04_delete_account.sql) → **Run** (self-serve **`delete_my_account()`** RPC for “Delete my profile” on **`/dashboard`** — testing reset).
8. Paste [`supabase/05_recommendation_v2.sql`](supabase/05_recommendation_v2.sql) → **Run** (replaces **`get_recommended_hacks()`** with v2 — helpful-boost, viewed/completed decay, `not_helpful` exclude on top of v1 tag overlap).
9. Paste [`supabase/06_hack_search.sql`](supabase/06_hack_search.sql) → **Run** (adds **`hacks.search_tsv`** weighted generated column + GIN index + **`find_hacks(query, limit)`** RPC for Postgres FTS — backs both the AskBar search dropdown and the AI `find_hacks` tool).
10. Paste [`supabase/07_ask_session.sql`](supabase/07_ask_session.sql) → **Run** (extends **`chat_sessions_kind_check`** with `'ask'` — required for the rolling, never-closing Ask chat session powering the global AskBar).
11. Paste [`supabase/08_seed_dummy_posts.sql`](supabase/08_seed_dummy_posts.sql) → **Run** (seeds 10 curated **post** rows + their sector/tool tags; UUIDs are hardcoded so they mirror **`POST_META_BY_ID`** in [`lib/dummy/posts.ts`](lib/dummy/posts.ts)). Idempotent — re-run any time to refresh titles/summaries. Verify: `select count(*) from public.hacks where id like 'aaaaaaaa-0001-%';` returns **10**.

[`supabase/future_schema.sql`](supabase/future_schema.sql) is a commented-only sketch for credits, reactions, follows, paths, career tables — **do not run** until you move those features out of sketch form.

### Supabase Auth — URLs

**Authentication → URL Configuration**

| Setting | Typical value |
|--------|----------------|
| **Site URL** | `http://localhost:3000` while developing; production URL once on Vercel |
| **Redirect URLs** | `http://localhost:3000/auth/callback`, `https://<your-production-domain>/auth/callback` |

Optional for **preview** deploys (`*.vercel.app`): Supabase supports a single `*` in the hostname, e.g. `https://*-<your-vercel-team>.vercel.app/auth/callback`.

> OAuth returns to **`/auth/callback`** on your Next app after Supabase finishes the exchange; whitelist that full URL pattern.

## 3. LinkedIn — OpenID Connect app

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps) and create an app.
2. Under **Products**, request **Sign In with LinkedIn using OpenID Connect** (scopes `openid`, `profile`, `email`).
3. Under **Auth → OAuth 2.0 settings**, set **Authorized redirect URLs** **exactly** to (no typo, **no stray `;` at the end**):

   `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`

4. Copy **Client ID** and **Client Secret**.

## 4. Supabase — enable LinkedIn (OIDC)

**Authentication → Providers → LinkedIn (OIDC)**

- Enable the provider
- Paste **Client ID** and **Client Secret**
- Save

The app calls `signInWithOAuth({ provider: "linkedin_oidc", ... })`.

## 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Sign in** → complete LinkedIn → you should land on **`/dashboard`** with your profile row.

After **`OPENAI_API_KEY`** + **`ai_chat_schema.sql`** are in place:

- **`/onboarding`** — conversational coach capturing sector, frustrations, and interests (`finish_onboarding` closes the loop).
- **`/checkin`** — weekly rhythm using the same streaming endpoint (`?kind=checkin`).

## 6. Vercel deployment — checklist

Follow in order:

1. **Push** latest code to GitHub (`main` recommended).
2. **Vercel** → open your project → **Settings → Git** → **Connect Repository** → select this repo (or **Add New → Project → Import Git Repository**).
3. Confirm **Framework Preset**: **Next.js**; build: `npm run build`, output handled by Next.
4. **Settings → Environment Variables** — add **for Production, Preview, and Development**:

   | Name | Value |
   |------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Same as `.env.local` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as `.env.local` |
   | `OPENAI_API_KEY` | Server-only coach key (**never** expose as `NEXT_PUBLIC_*`) |

5. Trigger **Deploy** and wait until it succeeds. Copy your **Production URL**, e.g. `https://slimmerbezig.vercel.app`.
6. **Supabase → Authentication → URL Configuration**  
   - **Site URL**: set to that production URL.  
   - **Redirect URLs**: keep local `http://localhost:3000/auth/callback` and add **`https://<production>/auth/callback`** (exact HTTPS host).  
   - Optional: wildcard preview URL as above if you want PR previews to sign in.
7. **Test**: open production site → Sign in → LinkedIn → **`/dashboard`**. Confirm a row appears in **`profiles`** in Supabase.
8. **LinkedIn**: no changes — it still redirects only to **`…supabase.co/auth/v1/callback`**.

## 7. Supabase typed client (optional, later)

When you use the Supabase CLI linked to your project:

```bash
npx supabase gen types typescript --project-id <project-ref> > lib/database.types.ts
# or locally: npx supabase gen types typescript --local > lib/database.types.ts
```

Then wire the `Database` generic into Supabase clients for stronger typing.

## Project map

Product / architecture / vocabulary for agents & collaborators lives in **`docs/`** ([`docs/vision.md`](docs/vision.md) …); **README** is setup & ops only.

| Path | Purpose |
|------|---------|
| [`app/login/page.tsx`](app/login/page.tsx) | Login screen (LinkedIn button) |
| [`app/dashboard/`](app/dashboard/) | Protected area (**Next proxy** + layout `getUser` check) |
| [`app/auth/callback/route.ts`](app/auth/callback/route.ts) | Exchanges OAuth `code`; uses `x-forwarded-host` on Vercel |
| [`app/auth/actions.ts`](app/auth/actions.ts) | **`signOut`** Server Action (**POST**) — clears session |
| [`proxy.ts`](proxy.ts) | Next 16 **proxy** — refreshes Supabase cookies; redirects unauthenticated `/dashboard` |
| [`lib/supabase/proxy.ts`](lib/supabase/proxy.ts) | Shared `updateSession` logic invoked by [`proxy.ts`](proxy.ts) |
| [`lib/env.ts`](lib/env.ts) | Zod-validated public env vars |
| [`supabase/schema.sql`](supabase/schema.sql) | Auth baseline: `profiles` + new-user trigger (run **first**) |
| [`supabase/learning_schema.sql`](supabase/learning_schema.sql) | Learning MVP: hacks, tags, frustrations, check-ins, challenges, RLS, recommendations RPC |
| [`supabase/future_schema.sql`](supabase/future_schema.sql) | Commented sketch — credits / social / paths / careers (**don’t run** yet) |

## Troubleshooting

### `Could not parse module 'middleware.ts', file not found`

This project uses Next.js 16’s **`proxy.ts`** ([`proxy.ts`](proxy.ts)) instead of `middleware.ts`. If the dev server was left running across that rename (or Turbopack hot-reloaded), the **`.next`** folder can keep a stale reference to **`middleware.ts`**.

Fix:

1. **Stop** the dev server (**Ctrl+C** in the terminal where `npm run dev` is running).
2. Delete the cache:
   ```bash
   cd Slimmerbezig
   rm -rf .next
   ```
   If macOS refuses with “Directory not empty”, extended attributes sometimes block deletion — run once then remove again:
   ```bash
   xattr -cr .next && rm -rf .next
   ```
3. Start again:
   ```bash
   npm run dev
   ```

Do **not** add `middleware.ts` next to [`proxy.ts`](proxy.ts). Next.js 16 rejects having **both** files; see [`middleware-to-proxy`](https://nextjs.org/docs/messages/middleware-to-proxy).

## Connect this folder to GitHub

If you created the repo with `git init` locally instead of cloning:

```bash
git remote add origin <your-github-repo-url>
git push -u origin main
```

## Extending later (credits / social / ESCO depth)

Production tables reference **`profiles.id`**. Credits should stay **append-only** (see commented ideas in [`supabase/future_schema.sql`](supabase/future_schema.sql)). Map **ESCO URIs** onto `tags.esco_uri` in [`supabase/learning_schema.sql`](supabase/learning_schema.sql) when you import taxonomy — skill rollups then come from joins through `hack_tags` × `hack_interactions`.

Grant yourself **`curator`** or **`creator`** in **Table Editor → `profiles`** to seed hacks and tags in Supabase UI before UI exists.

## Scripts

```bash
npm run dev      # development
npm run build    # production build
npm run start    # run production server
npm run lint     # ESLint
```
