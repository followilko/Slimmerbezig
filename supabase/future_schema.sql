-- =============================================================================
-- DO NOT RUN YET — FUTURE DESIGN SKETCH ONLY
--
-- Tables not yet in learning_schema.sql: social graph, credits, comments,
-- curated learning paths, imported career history. Uncomment and adapt when
-- you are ready; prefer Supabase migrations (CLI) over one-off pastes.
--
-- Current runnable MVP lives in:
--   supabase/schema.sql          — auth + profiles baseline
--   supabase/learning_schema.sql — hacks, tags, frustrations, check-ins, etc.
-- =============================================================================

/*
-- ─── Append-only credits (reward creators later) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hack_id uuid REFERENCES public.hacks(id) ON DELETE SET NULL,
  delta integer NOT NULL,
  reason text NOT NULL CHECK (reason IN (
    'hack_published', 'tip_received', 'tip_given', 'challenge_resolved',
    'bonus', 'manual_adjust'
  )),
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT credit_delta_nonzero CHECK (delta <> 0)
);

CREATE INDEX IF NOT EXISTS credit_ledger_actor_created_idx
  ON public.credit_ledger (actor_id, created_at DESC);

-- RLS: SELECT own rows; INSERT only via SECURITY DEFINER RPC / Edge Function

-- ─── Comments (on hacks and/or challenges) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hack_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hack_id uuid NOT NULL REFERENCES public.hacks(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body_md text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.challenge_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body_md text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Reactions (likes on hacks) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hack_reactions (
  hack_id uuid NOT NULL REFERENCES public.hacks(id) ON DELETE CASCADE,
  reactor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'like',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (hack_id, reactor_id, kind)
);

-- ─── Follow graph ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);

-- ─── Curated multi-hack sequences ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_path_steps (
  path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  step_order int NOT NULL,
  hack_id uuid NOT NULL REFERENCES public.hacks(id) ON DELETE CASCADE,
  PRIMARY KEY (path_id, step_order),
  UNIQUE (path_id, hack_id)
);

-- ─── Imported career signals (beyond LinkedIn OIDC headline) ────────────────
CREATE TABLE IF NOT EXISTS public.job_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  organization text,
  started_on date,
  ended_on date,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'linkedin_import', 'resume_parse')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  started_on date,
  ended_on date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Example: ESCO-linked skills per user project (fine-grained later) ───────
CREATE TABLE IF NOT EXISTS public.user_skill_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  evidence text,
  hack_interaction_pk text, -- composite key string or FK to ledger later
  created_at timestamptz NOT NULL DEFAULT now()
);
*/

/*
-- ─── Typed client generation ────────────────────────────────────────────────
--   npx supabase gen types typescript --project-id <ref> > lib/database.types.ts
*/
