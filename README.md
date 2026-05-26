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

### Run the database schema

1. Open **SQL Editor** in Supabase.
2. Paste the contents of [`supabase/schema.sql`](supabase/schema.sql).
3. Click **Run**.

This creates **`public.profiles`**, Row Level Security, and a trigger so every new **`auth.users`** row gets a matching profile (name, email, avatar from LinkedIn metadata where available).

**Do not run** [`supabase/future_schema.sql`](supabase/future_schema.sql) yet — it is a commented sketch for posts / credits / tags (ESCO-ready).

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

| Path | Purpose |
|------|---------|
| [`app/login/page.tsx`](app/login/page.tsx) | Login screen (LinkedIn button) |
| [`app/dashboard/`](app/dashboard/) | Protected area (**Next proxy** + layout `getUser` check) |
| [`app/auth/callback/route.ts`](app/auth/callback/route.ts) | Exchanges OAuth `code`; uses `x-forwarded-host` on Vercel |
| [`app/auth/actions.ts`](app/auth/actions.ts) | **`signOut`** Server Action (**POST**) — clears session |
| [`proxy.ts`](proxy.ts) | Next 16 **proxy** — refreshes Supabase cookies; redirects unauthenticated `/dashboard` |
| [`lib/supabase/proxy.ts`](lib/supabase/proxy.ts) | Shared `updateSession` logic invoked by [`proxy.ts`](proxy.ts) |
| [`lib/env.ts`](lib/env.ts) | Zod-validated public env vars |
| [`supabase/schema.sql`](supabase/schema.sql) | Run in SQL Editor (**current**) |
| [`supabase/future_schema.sql`](supabase/future_schema.sql) | Design sketch (**do not run** until reviewed) |

## Connect this folder to GitHub

If you created the repo with `git init` locally instead of cloning:

```bash
git remote add origin <your-github-repo-url>
git push -u origin main
```

## Extending later (learning paths / ESCO / credits)

New domain tables should reference **`profiles.id`**. Prefer an **append-only `credit_ledger`** for balances (see commented sketch in [`supabase/future_schema.sql`](supabase/future_schema.sql)).

## Scripts

```bash
npm run dev      # development
npm run build    # production build
npm run start    # run production server
npm run lint     # ESLint
```
