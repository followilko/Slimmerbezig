# Slimmerbezig

Minimal **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui** app with **LinkedIn OIDC** via **Supabase Auth**, a **protected dashboard**, and a **`profiles`** table in Postgres that is filled automatically on first sign-in.

## What you need on your machine

- **Node.js** 20+ (you’re on 24 — fine)
- **npm** (comes with Node)
- A **GitHub** repo, **Vercel** project, and **Supabase** project (you already have these)

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

### Supabase Auth — URLs

**Authentication → URL Configuration**

| Setting | Typical value |
|--------|----------------|
| **Site URL** | `http://localhost:3000` while developing |
| **Redirect URLs** | Add BOTH `http://localhost:3000/auth/callback` and later `https://<your-vercel-domain>/auth/callback` |

> The OAuth flow returns to **`/auth/callback`** with a `code` query param; Supabase must allow that exact redirect.

## 3. LinkedIn — OpenID Connect app

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps) and create an app.
2. Under **Products**, request **Sign In with LinkedIn using OpenID Connect** (scopes `openid`, `profile`, `email`).
3. Under **Auth → OAuth 2.0 settings**, set **Authorized redirect URLs** to:

   `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`

   Replace `<YOUR_SUPABASE_PROJECT_REF>` with the subdomain from your Supabase URL (the part before `.supabase.co`).

4. Copy **Client ID** and **Client Secret**.

## 4. Supabase — enable LinkedIn (OIDC)

**Authentication → Providers → LinkedIn (OIDC)**

- Enable the provider
- Paste **Client ID** and **Client Secret**
- Save

In the app we call `signInWithOAuth({ provider: "linkedin_oidc", ... })`.

## 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Sign in** → complete LinkedIn → you should land on **`/dashboard`** with your profile row.

## 6. Vercel

1. Import the GitHub repo into your Vercel project (or connect via Git).
2. **Settings → Environment Variables** — add the same two variables as in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy.
4. Update Supabase **Site URL** to your production URL (e.g. `https://your-app.vercel.app`) and ensure **Redirect URLs** includes `https://your-app.vercel.app/auth/callback`.

## Project map

| Path | Purpose |
|------|---------|
| [`app/login/page.tsx`](app/login/page.tsx) | Login screen (LinkedIn button) |
| [`app/dashboard/`](app/dashboard/) | Protected area (middleware + layout check) |
| [`app/auth/callback/route.ts`](app/auth/callback/route.ts) | Exchanges OAuth `code` for a session |
| [`app/auth/signout/route.ts`](app/auth/signout/route.ts) | Clears session |
| [`middleware.ts`](middleware.ts) | Refreshes Supabase session cookies; blocks `/dashboard` when logged out |
| [`lib/supabase/`](lib/supabase/) | Browser / server / middleware Supabase clients |
| [`supabase/schema.sql`](supabase/schema.sql) | Paste into Supabase SQL Editor |

## Connect this folder to GitHub

If you created the repo with `git init` locally instead of cloning:

```bash
git remote add origin <your-github-repo-url>
git push -u origin main
```

## Extending later (learning paths / ESCO)

Keep related data in **new tables** that reference **`profiles.id`** (`uuid`), e.g. `learning_paths(user_id uuid references profiles(id) ...)`. That keeps Auth users, profiles, and domain data cleanly separated.

## Scripts

```bash
npm run dev      # development
npm run build    # production build
npm run start    # run production server
npm run lint     # ESLint
```
