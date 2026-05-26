-- =============================================================================
-- Slimmerbezig — learning platform schema (MVP)
-- Run in Supabase: SQL Editor → New query → Paste → Run
--
-- Prerequisite: run supabase/schema.sql first (profiles + handle_new_user trigger).
-- This file is additive only (no DROP TABLE). Safe to re-run policy blocks if you
-- adjust policies (we DROP POLICY IF EXISTS before CREATE).
--
-- After running: optional SEED block at bottom for sector + sample tags.
-- =============================================================================

-- ─── 1. Extend profiles — role gating, sector, LinkedIn-style copy fields ────
alter table public.profiles
  add column if not exists role text not null default 'learner'
    constraint profiles_role_check
      check (role in ('learner', 'creator', 'curator', 'admin')),
  add column if not exists sector text
    constraint profiles_sector_check
      check (
        sector is null
        or sector in (
          'design',
          'marketing',
          'sales',
          'finance',
          'product',
          'engineering',
          'operations',
          'hr',
          'other'
        )
      ),
  add column if not exists headline text,
  add column if not exists bio text;

comment on column public.profiles.role is
  'learner | creator (can publish hacks) | curator (admin content) | admin';
comment on column public.profiles.sector is
  'User primary field; align tag slugs in tags table (kind=sector) for matching.';

-- ─── 2. Tags (ESCO-ready via esco_uri) ─────────────────────────────────────
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  kind text not null default 'topic'
    constraint tags_kind_check
      check (kind in ('sector', 'topic', 'skill', 'tool', 'frustration')),
  esco_uri text unique,
  created_at timestamptz not null default now()
);

create index if not exists tags_kind_slug_idx on public.tags (kind, slug);

-- ─── 3. Hacks (curated + user-authored) ─────────────────────────────────────
create table if not exists public.hacks (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles (id) on delete set null,
  source text not null default 'curated'
    constraint hacks_source_check
      check (source in ('curated', 'user')),
  title text not null,
  summary text,
  body_md text not null default '',
  status text not null default 'draft'
    constraint hacks_status_check
      check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists hacks_set_updated_at on public.hacks;

create trigger hacks_set_updated_at
  before update on public.hacks
  for each row execute function public.profiles_set_updated_at();

create table if not exists public.hack_tags (
  hack_id uuid not null references public.hacks (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (hack_id, tag_id)
);

create index if not exists hacks_status_idx on public.hacks (status);
create index if not exists hack_tags_tag_idx on public.hack_tags (tag_id);

-- ─── 4. Onboarding frustrations + tag links ─────────────────────────────────
create table if not exists public.user_frustrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.user_frustration_tags (
  frustration_id uuid not null references public.user_frustrations (id)
    on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (frustration_id, tag_id)
);

create index if not exists frustrations_user_idx
  on public.user_frustrations (user_id, created_at desc);

-- ─── 5. Weekly check-ins ─────────────────────────────────────────────────────
create table if not exists public.weekly_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  body text not null,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table if not exists public.weekly_checkin_tags (
  checkin_id uuid not null references public.weekly_checkins (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (checkin_id, tag_id)
);

create index if not exists checkins_user_week_idx
  on public.weekly_checkins (user_id, week_start desc);

-- ─── 6. Challenges ("help me with X") ────────────────────────────────────────
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text,
  status text not null default 'open'
    constraint challenges_status_check
      check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.challenge_tags (
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (challenge_id, tag_id)
);

create index if not exists challenges_status_idx on public.challenges (status);

-- ─── 7. Hack interactions (saved / viewed / completed / feedback) ───────────
create table if not exists public.hack_interactions (
  user_id uuid not null references public.profiles (id) on delete cascade,
  hack_id uuid not null references public.hacks (id) on delete cascade,
  kind text not null
    constraint hack_interactions_kind_check
      check (kind in ('saved', 'viewed', 'completed', 'helpful', 'not_helpful')),
  created_at timestamptz not null default now(),
  primary key (user_id, hack_id, kind)
);

create index if not exists interactions_hack_idx on public.hack_interactions (hack_id);
create index if not exists interactions_user_idx on public.hack_interactions (user_id);

-- ─── 8. Row Level Security ───────────────────────────────────────────────────
alter table public.tags enable row level security;
alter table public.hacks enable row level security;
alter table public.hack_tags enable row level security;
alter table public.user_frustrations enable row level security;
alter table public.user_frustration_tags enable row level security;
alter table public.weekly_checkins enable row level security;
alter table public.weekly_checkin_tags enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_tags enable row level security;
alter table public.hack_interactions enable row level security;

-- Helper: curator or admin
-- (inline EXISTS in policies below)

-- --- tags ---
drop policy if exists "tags_select_authenticated" on public.tags;
drop policy if exists "tags_insert_curator" on public.tags;
drop policy if exists "tags_update_curator" on public.tags;
drop policy if exists "tags_delete_curator" on public.tags;

create policy "tags_select_authenticated"
  on public.tags for select
  to authenticated
  using (true);

create policy "tags_insert_curator"
  on public.tags for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('curator', 'admin')
    )
  );

create policy "tags_update_curator"
  on public.tags for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('curator', 'admin')
    )
  );

create policy "tags_delete_curator"
  on public.tags for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('curator', 'admin')
    )
  );

-- --- hacks ---
drop policy if exists "hacks_select" on public.hacks;
drop policy if exists "hacks_insert" on public.hacks;
drop policy if exists "hacks_update" on public.hacks;
drop policy if exists "hacks_delete" on public.hacks;

create policy "hacks_select"
  on public.hacks for select
  to authenticated
  using (
    status = 'published'
    or author_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('curator', 'admin')
    )
  );

create policy "hacks_insert"
  on public.hacks for insert
  to authenticated
  with check (
    (
      author_id = (select auth.uid())
      and exists (
        select 1 from public.profiles p
        where p.id = (select auth.uid())
          and p.role in ('creator', 'curator', 'admin')
      )
    )
    or (
      author_id is null
      and exists (
        select 1 from public.profiles p
        where p.id = (select auth.uid())
          and p.role in ('curator', 'admin')
      )
    )
  );

create policy "hacks_update"
  on public.hacks for update
  to authenticated
  using (
    author_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('curator', 'admin')
    )
  )
  with check (
    author_id = (select auth.uid())
    or author_id is null
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('curator', 'admin')
    )
  );

create policy "hacks_delete"
  on public.hacks for delete
  to authenticated
  using (
    author_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('curator', 'admin')
    )
  );

-- --- hack_tags ---
drop policy if exists "hack_tags_select" on public.hack_tags;
drop policy if exists "hack_tags_insert" on public.hack_tags;
drop policy if exists "hack_tags_delete" on public.hack_tags;

create policy "hack_tags_select"
  on public.hack_tags for select
  to authenticated
  using (
    exists (
      select 1 from public.hacks h
      where h.id = hack_tags.hack_id
        and (
          h.status = 'published'
          or h.author_id = (select auth.uid())
          or exists (
            select 1 from public.profiles p
            where p.id = (select auth.uid())
              and p.role in ('curator', 'admin')
          )
        )
    )
  );

create policy "hack_tags_insert"
  on public.hack_tags for insert
  to authenticated
  with check (
    exists (
      select 1 from public.hacks h
      where h.id = hack_tags.hack_id
        and (
          h.author_id = (select auth.uid())
          or exists (
            select 1 from public.profiles p
            where p.id = (select auth.uid())
              and p.role in ('curator', 'admin')
          )
        )
    )
  );

create policy "hack_tags_delete"
  on public.hack_tags for delete
  to authenticated
  using (
    exists (
      select 1 from public.hacks h
      where h.id = hack_tags.hack_id
        and (
          h.author_id = (select auth.uid())
          or exists (
            select 1 from public.profiles p
            where p.id = (select auth.uid())
              and p.role in ('curator', 'admin')
          )
        )
    )
  );

-- --- user_frustrations ---
drop policy if exists "user_frustrations_select_own" on public.user_frustrations;
drop policy if exists "user_frustrations_insert_own" on public.user_frustrations;
drop policy if exists "user_frustrations_update_own" on public.user_frustrations;
drop policy if exists "user_frustrations_delete_own" on public.user_frustrations;

create policy "user_frustrations_select_own"
  on public.user_frustrations for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "user_frustrations_insert_own"
  on public.user_frustrations for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "user_frustrations_update_own"
  on public.user_frustrations for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "user_frustrations_delete_own"
  on public.user_frustrations for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- --- user_frustration_tags ---
drop policy if exists "user_frustration_tags_all_own" on public.user_frustration_tags;

create policy "user_frustration_tags_all_own"
  on public.user_frustration_tags for all
  to authenticated
  using (
    exists (
      select 1 from public.user_frustrations f
      where f.id = user_frustration_tags.frustration_id
        and f.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.user_frustrations f
      where f.id = user_frustration_tags.frustration_id
        and f.user_id = (select auth.uid())
    )
  );

-- --- weekly_checkins ---
drop policy if exists "weekly_checkins_select_own" on public.weekly_checkins;
drop policy if exists "weekly_checkins_insert_own" on public.weekly_checkins;
drop policy if exists "weekly_checkins_update_own" on public.weekly_checkins;
drop policy if exists "weekly_checkins_delete_own" on public.weekly_checkins;

create policy "weekly_checkins_select_own"
  on public.weekly_checkins for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "weekly_checkins_insert_own"
  on public.weekly_checkins for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "weekly_checkins_update_own"
  on public.weekly_checkins for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "weekly_checkins_delete_own"
  on public.weekly_checkins for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- --- weekly_checkin_tags ---
drop policy if exists "weekly_checkin_tags_all_own" on public.weekly_checkin_tags;

create policy "weekly_checkin_tags_all_own"
  on public.weekly_checkin_tags for all
  to authenticated
  using (
    exists (
      select 1 from public.weekly_checkins c
      where c.id = weekly_checkin_tags.checkin_id
        and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.weekly_checkins c
      where c.id = weekly_checkin_tags.checkin_id
        and c.user_id = (select auth.uid())
    )
  );

-- --- challenges (readable by peers; writable by owner) ---
drop policy if exists "challenges_select_authenticated" on public.challenges;
drop policy if exists "challenges_insert_own" on public.challenges;
drop policy if exists "challenges_update_own" on public.challenges;
drop policy if exists "challenges_delete_own" on public.challenges;

create policy "challenges_select_authenticated"
  on public.challenges for select
  to authenticated
  using (true);

create policy "challenges_insert_own"
  on public.challenges for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "challenges_update_own"
  on public.challenges for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "challenges_delete_own"
  on public.challenges for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- --- challenge_tags ---
drop policy if exists "challenge_tags_select_authenticated" on public.challenge_tags;
drop policy if exists "challenge_tags_insert_own_challenge" on public.challenge_tags;
drop policy if exists "challenge_tags_delete_own_challenge" on public.challenge_tags;

create policy "challenge_tags_select_authenticated"
  on public.challenge_tags for select
  to authenticated
  using (true);

create policy "challenge_tags_insert_own_challenge"
  on public.challenge_tags for insert
  to authenticated
  with check (
    exists (
      select 1 from public.challenges ch
      where ch.id = challenge_tags.challenge_id
        and ch.user_id = (select auth.uid())
    )
  );

create policy "challenge_tags_delete_own_challenge"
  on public.challenge_tags for delete
  to authenticated
  using (
    exists (
      select 1 from public.challenges ch
      where ch.id = challenge_tags.challenge_id
        and ch.user_id = (select auth.uid())
    )
  );

-- --- hack_interactions ---
drop policy if exists "hack_interactions_select_own" on public.hack_interactions;
drop policy if exists "hack_interactions_insert_own" on public.hack_interactions;
drop policy if exists "hack_interactions_delete_own" on public.hack_interactions;

create policy "hack_interactions_select_own"
  on public.hack_interactions for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "hack_interactions_insert_own"
  on public.hack_interactions for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.hacks h
      where h.id = hack_interactions.hack_id
        and (
          h.status = 'published'
          or h.author_id = (select auth.uid())
          or exists (
            select 1 from public.profiles p
            where p.id = (select auth.uid())
              and p.role in ('curator', 'admin')
          )
        )
    )
  );

create policy "hack_interactions_delete_own"
  on public.hack_interactions for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ─── 9. Recommended hacks (query helper for the app) ───────────────────────
-- SECURITY INVOKER (default): RLS on public.hacks still applies.
create or replace function public.get_recommended_hacks(p_limit int default 20)
returns setof public.hacks
language sql
stable
set search_path = public
as $$
  select h.*
  from public.hacks h
  where h.status = 'published'
    and exists (
      select 1
      from public.hack_tags ht
      where ht.hack_id = h.id
        and ht.tag_id in (
          -- Sector tag matching profiles.sector (slug = sector value)
          select t.id
          from public.tags t
          where t.kind = 'sector'
            and t.slug = (
              select p.sector::text
              from public.profiles p
              where p.id = (select auth.uid())
            )
          union
          select ft.tag_id
          from public.user_frustration_tags ft
          join public.user_frustrations f on f.id = ft.frustration_id
          where f.user_id = (select auth.uid())
            and f.resolved_at is null
          union
          select ct.tag_id
          from public.weekly_checkin_tags ct
          join public.weekly_checkins c on c.id = ct.checkin_id
          where c.user_id = (select auth.uid())
        )
    )
  order by h.created_at desc
  limit coalesce(p_limit, 20);
$$;

comment on function public.get_recommended_hacks(int) is
  'Returns published hacks whose tags overlap the caller sector + open frustration tags + any weekly check-in tags.';

grant execute on function public.get_recommended_hacks(int) to authenticated;

-- =============================================================================
-- OPTIONAL SEED — run as a second query if you want starter tags.
-- Sector slugs MUST match profiles.sector CHECK values for matching to work.
-- =============================================================================
/*
insert into public.tags (slug, label, kind) values
  ('design', 'Design', 'sector'),
  ('marketing', 'Marketing', 'sector'),
  ('sales', 'Sales', 'sector'),
  ('finance', 'Finance', 'sector'),
  ('product', 'Product', 'sector'),
  ('engineering', 'Engineering', 'sector'),
  ('operations', 'Operations', 'sector'),
  ('hr', 'HR', 'sector'),
  ('other', 'Other', 'sector')
on conflict (slug) do nothing;

insert into public.tags (slug, label, kind) values
  ('meetings', 'Too many meetings', 'frustration'),
  ('context_switching', 'Context switching', 'frustration'),
  ('email_overload', 'Email / notification overload', 'frustration'),
  ('documentation', 'Documentation / knowledge gaps', 'frustration'),
  ('tooling', 'Tooling / workflow friction', 'frustration'),
  ('prioritization', 'Prioritization / unclear goals', 'frustration')
on conflict (slug) do nothing;
*/
