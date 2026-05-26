-- =============================================================================
-- DO NOT RUN IN PRODUCTION YET — DESIGN SKETCH ONLY
--
-- Future schema for: micro-learning hacks, credits (ledger), ESCO-aligned tags,
-- reactions, follows, comments. Review and uncomment / adapt when you're ready,
-- ideally via proper Supabase migrations (CLI) rather than paste-and-pray.
--
-- Requires Postgres extension for case-insensitive username (Supabase enables
-- pg extensions from Dashboard → Database → Extensions, or CREATE EXTENSION):
--   CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA extensions;
--
-- Prefer: REFERENCES public.profiles(id) everywhere for relational integrity.
-- Credits: append-only credit_ledger; balance = sum(delta) grouped by actor_id.
-- =============================================================================

/*
-- ─── Extend profiles ───────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username citext UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS headline text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
-- Optionally back-fill username from slugified LinkedIn meta in a migration.

-- ─── Posts (hacks / tips shared by learners) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text UNIQUE,
  body_md text NOT NULL DEFAULT '',
  body_html text,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Tags (ESCO URI optional for future taxonomy) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  label text NOT NULL,
  esco_uri text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_tags (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- ─── Reactions (like / rocket / insightful — pick enum values later) ──────
CREATE TABLE IF NOT EXISTS public.reactions (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reactor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'like',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, reactor_id, kind)
);

-- ─── Comments ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body_md text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Follow graph ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);

-- ─── Credits (append-only ledger — never mutate rows except soft-delete flags if ever) ─
CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  delta integer NOT NULL,
  reason text NOT NULL CHECK (reason IN ('post_created','tip_received','tip_given','bonus','manual_adjust')),
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT credit_delta_nonzero CHECK (delta <> 0)
);

CREATE INDEX IF NOT EXISTS credit_ledger_actor_created_idx
  ON public.credit_ledger (actor_id, created_at DESC);

-- ─── Generic updated_at triggers (reuse or merge with profiles pattern) ───
-- Same pattern as public.profiles_set_updated_at(): apply BEFORE UPDATE.

-- ─── Row Level Security (sketch — tighten before launch) ───────────────────
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

-- Authenticated readers can browse published posts
CREATE POLICY posts_select_public ON public.posts FOR SELECT
  USING (status = 'published' OR auth.uid() = author_id);

CREATE POLICY posts_insert_own ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY posts_update_own ON public.posts FOR UPDATE
  USING (auth.uid() = author_id);

-- Tags: read all authenticated; insert moderation / admin later
CREATE POLICY tags_select_authed ON public.tags FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY post_tags_select_join ON public.post_tags FOR SELECT USING (true); -- tighten via joins

CREATE POLICY reactions_all_own ON public.reactions FOR ALL
  USING (auth.uid() = reactor_id);

CREATE POLICY comments_select_related ON public.comments FOR SELECT USING (true); -- tighten: join post visibility
CREATE POLICY comments_insert_own ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY comments_update_own ON public.comments FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY follows_select_own ON public.follows FOR SELECT
  USING (auth.uid() = follower_id OR auth.uid() = followee_id);

CREATE POLICY follows_insert_own ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY follows_delete_own ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Ledger: SELECT own rows only; INSERT only via SECURITY DEFINER Postgres functions (recommended)
CREATE POLICY credits_select_own ON public.credit_ledger FOR SELECT
  USING (auth.uid() = actor_id);

-- NO direct INSERT policy for anon/authenticated clients — grants go through RPC/triggers only.
*/

/*
-- ─── Typed client generation (later) ─────────────────────────────────────────
-- When the Supabase CLI is linked to your project:
--   npx supabase gen types typescript --project-id <ref> > lib/database.types.ts
--   # or locally: npx supabase gen types typescript --local > lib/database.types.ts
--
-- Then pass Db type into createBrowserClient/createServerClient for column autocomplete.
*/
