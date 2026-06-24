-- =============================================================================
-- Slimmerbezig — Post maker base: engagement ladder (XP + levels), channels,
-- structured hack fields, and a secure publish RPC.
--
-- Run AFTER supabase/10_brand_assets_storage.sql.
-- Additive only (no destructive DDL). Safe to re-run (IF NOT EXISTS + DROP
-- POLICY/FUNCTION guards; seeds use ON CONFLICT DO NOTHING).
--
-- Design notes:
--  * XP lives in its own table `user_xp` (NOT on profiles) because
--    `profiles_update_own` lets a user update any column on their own row —
--    storing XP there would let users forge points. `user_xp` has no
--    authenticated INSERT/UPDATE policy; only the SECURITY DEFINER RPCs write it.
--  * `points_ledger` is the append-only audit trail; `user_xp.xp` is the
--    denormalized running total (fast single-row read, no SUM per request).
--  * `levels` is a capability-flagged ladder. Add rows to scale to N levels —
--    no code change needed. Both the app and `publish_hack` read it.
-- =============================================================================

-- ─── 1. Engagement ladder: levels ───────────────────────────────────────────
create table if not exists public.levels (
  level smallint primary key,
  slug text unique not null,
  name text not null,
  min_xp integer not null default 0,
  can_create_hacks boolean not null default false,
  can_create_challenges boolean not null default false,
  can_create_channels boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.levels is
  'Capability-flagged engagement ladder. A user has every capability whose row has min_xp <= their user_xp.xp. Add rows to extend (scales to N levels).';

-- Seed >= 4 levels. Thresholds are tunable data (not code).
-- NOTE (bootstrap): contributor unlocks hack/challenge creation at 250 XP, but
-- XP-earning beyond publishing is deferred — so to test as a non-staff user,
-- either lower contributor.min_xp here or seed a user_xp row. Staff roles
-- (creator/curator/admin) bypass the gate via user_can_create_hacks().
insert into public.levels
  (level, slug, name, min_xp, can_create_hacks, can_create_challenges, can_create_channels)
values
  (1, 'explorer',    'Explorer',    0,    false, false, false),
  (2, 'contributor', 'Contributor', 250,  true,  true,  false),
  (3, 'specialist',  'Specialist',  1500, true,  true,  true),
  (4, 'ambassador',  'Ambassador',  5000, true,  true,  true)
on conflict (level) do nothing;

-- ─── 2. XP: denormalized total (forge-proof) + append-only ledger ────────────
create table if not exists public.user_xp (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  xp integer not null default 0,
  updated_at timestamptz not null default now()
);

comment on table public.user_xp is
  'Denormalized lifetime XP per user (source of truth for display + level). Written only by SECURITY DEFINER RPCs; no authenticated write policy (forge-proof).';

create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta integer not null,
  reason text not null,
  source_kind text,
  source_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists points_ledger_user_idx
  on public.points_ledger (user_id, created_at desc);

comment on table public.points_ledger is
  'Append-only XP audit trail. Written only by SECURITY DEFINER RPCs (no authenticated INSERT policy).';

-- ─── 3. Structured hack fields (DB-backed presentation + taxonomy) ───────────
alter table public.hacks
  add column if not exists post_type text not null default 'recipe'
    constraint hacks_post_type_check
      check (post_type in ('bite', 'recipe', 'guide', 'external')),
  add column if not exists primary_tool_slug text,
  add column if not exists estimated_minutes integer,
  add column if not exists goal text
    constraint hacks_goal_check
      check (
        goal is null
        or goal in (
          'automate', 'analyse', 'generate', 'organise',
          'communicate', 'learn', 'decide'
        )
      );

comment on column public.hacks.primary_tool_slug is
  'Brand/tool slug for card theming (matches lib/brands/manifest.ts). Null -> fallback brand.';

-- ─── 4. Channels ─────────────────────────────────────────────────────────────
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists channels_active_idx on public.channels (is_active);

insert into public.channels (slug, name, description) values
  ('marketing-automation', 'Marketing Automation', 'AI-hacks die marketingwerk automatiseren.'),
  ('ai-design',            'AI voor Design',       'Sneller ontwerpen met AI-tools.'),
  ('dev-agents',           'Dev & Agents',         'Coderen, refactoren en bouwen met AI-agents.'),
  ('data-insights',        'Data & Insights',      'Van ruwe data naar heldere inzichten.'),
  ('productivity',         'Productiviteit',       'Minder busywork, meer focus.'),
  ('content-creation',     'Content Creatie',      'Tekst, beeld en video met AI.'),
  ('sales-ai',             'Sales & AI',           'Leads, outreach en deals versnellen.'),
  ('ops-automation',       'Operations Automation','Processen en workflows stroomlijnen.')
on conflict (slug) do nothing;

create table if not exists public.hack_channels (
  hack_id uuid not null references public.hacks (id) on delete cascade,
  channel_id uuid not null references public.channels (id) on delete cascade,
  primary key (hack_id, channel_id)
);

create index if not exists hack_channels_channel_idx
  on public.hack_channels (channel_id);

-- ─── 5. Row Level Security ───────────────────────────────────────────────────
alter table public.levels enable row level security;
alter table public.user_xp enable row level security;
alter table public.points_ledger enable row level security;
alter table public.channels enable row level security;
alter table public.hack_channels enable row level security;

-- levels: read for all authenticated; write curator/admin only
drop policy if exists "levels_select_authenticated" on public.levels;
create policy "levels_select_authenticated"
  on public.levels for select to authenticated using (true);

drop policy if exists "levels_write_curator" on public.levels;
create policy "levels_write_curator"
  on public.levels for all to authenticated
  using (
    exists (select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('curator', 'admin'))
  )
  with check (
    exists (select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('curator', 'admin'))
  );

-- user_xp: select own (+ curator); NO authenticated write (RPC-only)
drop policy if exists "user_xp_select_own" on public.user_xp;
create policy "user_xp_select_own"
  on public.user_xp for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('curator', 'admin'))
  );

-- points_ledger: select own (+ curator); NO authenticated write (RPC-only)
drop policy if exists "points_ledger_select_own" on public.points_ledger;
create policy "points_ledger_select_own"
  on public.points_ledger for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('curator', 'admin'))
  );

-- channels: read for all authenticated; write curator/admin only (creation later)
drop policy if exists "channels_select_authenticated" on public.channels;
create policy "channels_select_authenticated"
  on public.channels for select to authenticated using (true);

drop policy if exists "channels_write_curator" on public.channels;
create policy "channels_write_curator"
  on public.channels for all to authenticated
  using (
    exists (select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('curator', 'admin'))
  )
  with check (
    exists (select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('curator', 'admin'))
  );

-- hack_channels: select when parent hack readable; write by hack author or curator
drop policy if exists "hack_channels_select" on public.hack_channels;
create policy "hack_channels_select"
  on public.hack_channels for select to authenticated
  using (
    exists (
      select 1 from public.hacks h
      where h.id = hack_channels.hack_id
        and (
          h.status = 'published'
          or h.author_id = (select auth.uid())
          or exists (select 1 from public.profiles p
            where p.id = (select auth.uid()) and p.role in ('curator', 'admin'))
        )
    )
  );

drop policy if exists "hack_channels_write" on public.hack_channels;
create policy "hack_channels_write"
  on public.hack_channels for all to authenticated
  using (
    exists (
      select 1 from public.hacks h
      where h.id = hack_channels.hack_id
        and (
          h.author_id = (select auth.uid())
          or exists (select 1 from public.profiles p
            where p.id = (select auth.uid()) and p.role in ('curator', 'admin'))
        )
    )
  )
  with check (
    exists (
      select 1 from public.hacks h
      where h.id = hack_channels.hack_id
        and (
          h.author_id = (select auth.uid())
          or exists (select 1 from public.profiles p
            where p.id = (select auth.uid()) and p.role in ('curator', 'admin'))
        )
    )
  );

-- ─── 6. Capability helpers (shared by app + publish_hack RPC) ────────────────
create or replace function public.user_total_xp(p_user uuid)
returns integer
language sql
stable
set search_path = public
as $$
  select coalesce((select xp from public.user_xp where user_id = p_user), 0);
$$;

create or replace function public.user_level(p_user uuid)
returns smallint
language sql
stable
set search_path = public
as $$
  select coalesce(
    (
      select l.level
      from public.levels l
      where l.min_xp <= public.user_total_xp(p_user)
      order by l.min_xp desc, l.level desc
      limit 1
    ),
    1::smallint
  );
$$;

-- Staff roles (creator/curator/admin) bypass the XP gate; everyone else needs a
-- level row with can_create_hacks whose min_xp they have reached.
create or replace function public.user_can_create_hacks(p_user uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    exists (
      select 1 from public.profiles p
      where p.id = p_user and p.role in ('creator', 'curator', 'admin')
    )
    or exists (
      select 1 from public.levels l
      where l.can_create_hacks
        and l.min_xp <= public.user_total_xp(p_user)
    );
$$;

grant execute on function public.user_total_xp(uuid) to authenticated;
grant execute on function public.user_level(uuid) to authenticated;
grant execute on function public.user_can_create_hacks(uuid) to authenticated;

-- ─── 7. publish_hack: atomic, secure publish + XP award ──────────────────────
create or replace function public.publish_hack(
  p_title text,
  p_summary text,
  p_body_md text,
  p_post_type text,
  p_tool_slug text,
  p_estimated_minutes integer,
  p_goal text,
  p_tag_slugs text[],
  p_channel_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_hack_id uuid;
  v_active_channels int;
  v_award constant int := 250;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if not public.user_can_create_hacks(v_uid) then
    raise exception 'not_allowed';
  end if;

  if coalesce(trim(p_title), '') = '' then
    raise exception 'title_required';
  end if;

  if p_channel_ids is null or array_length(p_channel_ids, 1) is null then
    raise exception 'channel_required';
  end if;

  select count(*) into v_active_channels
  from public.channels c
  where c.id = any (p_channel_ids) and c.is_active;

  if v_active_channels < 1 then
    raise exception 'channel_required';
  end if;

  insert into public.hacks (
    author_id, source, title, summary, body_md, status,
    post_type, primary_tool_slug, estimated_minutes, goal
  )
  values (
    v_uid, 'user', p_title, nullif(trim(coalesce(p_summary, '')), ''),
    coalesce(p_body_md, ''), 'published',
    coalesce(p_post_type, 'recipe'),
    nullif(trim(coalesce(p_tool_slug, '')), ''),
    p_estimated_minutes,
    nullif(trim(coalesce(p_goal, '')), '')
  )
  returning id into v_hack_id;

  -- Link existing tags by slug (tools/capabilities) + the primary tool tag.
  insert into public.hack_tags (hack_id, tag_id)
  select distinct v_hack_id, t.id
  from public.tags t
  where t.slug = any (
    coalesce(p_tag_slugs, array[]::text[])
    || case when nullif(trim(coalesce(p_tool_slug, '')), '') is not null
            then array[p_tool_slug] else array[]::text[] end
  )
  on conflict (hack_id, tag_id) do nothing;

  -- Link channels (validated active above).
  insert into public.hack_channels (hack_id, channel_id)
  select v_hack_id, c.id
  from public.channels c
  where c.id = any (p_channel_ids) and c.is_active
  on conflict (hack_id, channel_id) do nothing;

  -- Award XP: denormalized total + append-only ledger row.
  insert into public.user_xp (user_id, xp, updated_at)
  values (v_uid, v_award, now())
  on conflict (user_id) do update
    set xp = public.user_xp.xp + v_award, updated_at = now();

  insert into public.points_ledger (user_id, delta, reason, source_kind, source_id)
  values (v_uid, v_award, 'hack_published', 'hack', v_hack_id);

  return v_hack_id;
end;
$$;

grant execute on function public.publish_hack(
  text, text, text, text, text, integer, text, text[], uuid[]
) to authenticated;

comment on function public.publish_hack is
  'Atomic, capability-gated hack publish: inserts a user hack (status=published), links tag + channel rows (>=1 channel required), and awards 250 XP (user_xp + points_ledger). SECURITY DEFINER so it can write the forge-proof XP tables; gate enforced via user_can_create_hacks.';
