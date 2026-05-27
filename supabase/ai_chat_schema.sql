-- =============================================================================
-- Slimmerbezig — AI chat + personalization layer (additive)
-- Run AFTER supabase/schema.sql + supabase/learning_schema.sql
-- Safe additive DDL (uses IF NOT EXISTS where possible).
-- =============================================================================

-- ─── Extend tags.kind with capability vocabulary (planned taxonomy slot) ─
alter table public.tags drop constraint if exists tags_kind_check;

alter table public.tags
  add constraint tags_kind_check
    check (
      kind in (
        'sector',
        'topic',
        'skill',
        'tool',
        'frustration',
        'capability'
      )
    );

-- ─── Profiles: onboarding marker ─────────────────────────────────────────────
alter table public.profiles
  add column if not exists onboarded_at timestamptz;

comment on column public.profiles.onboarded_at is
  'Set when onboarding chat signals finish_onboarding succeeds. Nullable for legacy profiles.';

-- ─── Profile understanding (rolling LLM-derived memory, user-owned row) ──────
create table if not exists public.profile_understanding (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  summary text not null default '',
  signals jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ─── Chat sessions ──────────────────────────────────────────────────────────
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null
    constraint chat_sessions_kind_check
      check (kind in ('onboarding', 'checkin')),
  status text not null default 'open'
    constraint chat_sessions_status_check
      check (status in ('open', 'completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists chat_sessions_user_kind_open_idx
  on public.chat_sessions (user_id, kind, started_at desc);

-- At most one open session per (user, kind).
create unique index if not exists chat_sessions_one_open_per_user_kind_idx
  on public.chat_sessions (user_id, kind)
  where (status = 'open');

-- ─── Chat transcripts ──────────────────────────────────────────────────────
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions (id) on delete cascade,
  role text not null
    constraint chat_messages_role_check
      check (role in ('user', 'assistant', 'tool')),
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_session_idx
  on public.chat_messages (session_id, created_at);

-- ─── User interests (tool/capacity overlap hints from AI chat + future UI) ─
create table if not exists public.user_interests (
  user_id uuid not null references public.profiles (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  weight double precision not null default 1.0,
  source text,
  created_at timestamptz not null default now(),
  primary key (user_id, tag_id)
);

create index if not exists user_interests_tag_idx on public.user_interests (tag_id);

-- ─── Curator queue for vocabulary suggested by learners / LLMs ─────────────────
create table if not exists public.tag_suggestions (
  id uuid primary key default gen_random_uuid(),
  slug_guess text not null,
  label_guess text not null,
  kind text not null
    constraint tag_suggestions_kind_check
      check (
        kind in (
          'sector',
          'topic',
          'skill',
          'tool',
          'frustration',
          'capability'
        )
      ),
  proposed_by uuid not null references public.profiles (id) on delete cascade,
  source_session_id uuid references public.chat_sessions (id) on delete set null,
  status text not null default 'pending'
    constraint tag_suggestions_status_check
      check (status in ('pending', 'approved', 'rejected')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists tag_suggestions_status_idx
  on public.tag_suggestions (status, created_at desc);

-- ─── RLS ───────────────────────────────────────────────────────────────────
alter table public.profile_understanding enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.user_interests enable row level security;
alter table public.tag_suggestions enable row level security;

drop policy if exists "profile_understanding_select_own" on public.profile_understanding;
drop policy if exists "profile_understanding_upsert_own" on public.profile_understanding;
drop policy if exists "profile_understanding_update_own" on public.profile_understanding;
drop policy if exists "profile_understanding_all_own" on public.profile_understanding;

create policy "profile_understanding_all_own"
  on public.profile_understanding for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "chat_sessions_select_own" on public.chat_sessions;
drop policy if exists "chat_sessions_insert_own" on public.chat_sessions;
drop policy if exists "chat_sessions_update_own" on public.chat_sessions;

create policy "chat_sessions_select_own"
  on public.chat_sessions for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "chat_sessions_insert_own"
  on public.chat_sessions for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "chat_sessions_update_own"
  on public.chat_sessions for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "chat_messages_select_own" on public.chat_messages;
drop policy if exists "chat_messages_insert_own" on public.chat_messages;

create policy "chat_messages_select_own"
  on public.chat_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.chat_sessions s
      where s.id = chat_messages.session_id
        and s.user_id = (select auth.uid())
    )
  );

create policy "chat_messages_insert_own"
  on public.chat_messages for insert
  to authenticated
  with check (
    exists (
      select 1 from public.chat_sessions s
      where s.id = chat_messages.session_id
        and s.user_id = (select auth.uid())
    )
  );

drop policy if exists "user_interests_all_own" on public.user_interests;

create policy "user_interests_all_own"
  on public.user_interests for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "tag_suggestions_insert_auth" on public.tag_suggestions;
drop policy if exists "tag_suggestions_select" on public.tag_suggestions;
drop policy if exists "tag_suggestions_update_curator" on public.tag_suggestions;

create policy "tag_suggestions_insert_auth"
  on public.tag_suggestions for insert
  to authenticated
  with check (proposed_by = (select auth.uid()));

create policy "tag_suggestions_select"
  on public.tag_suggestions for select
  to authenticated
  using (
    proposed_by = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('curator', 'admin')
    )
  );

create policy "tag_suggestions_update_curator"
  on public.tag_suggestions for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('curator', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('curator', 'admin')
    )
  );

-- ─── Extend recommended hacks with user_interests overlap ─────────────────
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
          union
          select ui.tag_id
          from public.user_interests ui
          where ui.user_id = (select auth.uid())
        )
    )
  order by h.created_at desc
  limit coalesce(p_limit, 20);
$$;

comment on function public.get_recommended_hacks(int) is
  'Returns published hacks whose tags overlap sector + open frustrations + weekly check-in tags + user_interests (AI chat).';

grant execute on function public.get_recommended_hacks(int) to authenticated;

-- =============================================================================
-- OPTIONAL SEED — baseline tool + capability tags (run manually if desired)
-- =============================================================================
/*
insert into public.tags (slug, label, kind) values
  ('chatgpt', 'ChatGPT', 'tool'),
  ('claude', 'Claude', 'tool'),
  ('gemini', 'Gemini', 'tool'),
  ('notion', 'Notion', 'tool'),
  ('excel', 'Excel', 'tool'),
  ('linear', 'Linear', 'tool'),
  ('text_generation', 'Text generation', 'capability'),
  ('structured_extraction', 'Structured extraction', 'capability'),
  ('agents', 'Agents', 'capability'),
  ('image_generation', 'Image generation', 'capability')
on conflict (slug) do nothing;
*/
