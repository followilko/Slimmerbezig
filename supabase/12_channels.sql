-- =============================================================================
-- Slimmerbezig — Channels: ownership, memberships, challenge links, a secure
-- create RPC (+100 XP), and a counts/overview RPC.
--
-- Run AFTER supabase/11_post_maker.sql.
-- Additive only (no destructive DDL). Safe to re-run (IF NOT EXISTS + DROP
-- POLICY/FUNCTION guards; seeds use ON CONFLICT DO NOTHING).
--
-- Design notes:
--  * Channels are now a first-class navigation destination (browse + detail),
--    not just a publish-time taxonomy. `channels` gains `owner_kind`
--    (platform | user) and `created_by` so we can tell platform channels from
--    member-created ones. `owner_kind` is left extensible — an `organization`
--    source can be added later WITHOUT reworking this schema.
--  * Membership lives in `channel_memberships` with a per-row `notify`
--    preference (default true). Notification *delivery* is deferred; this is
--    just the stored preference + UI toggle.
--  * Member counts must NOT depend on reading other users' profiles
--    (profiles RLS is select-own). They come from channel_memberships, which is
--    readable by any authenticated user (count-only need).
--  * `create_channel` mirrors `publish_hack`: SECURITY DEFINER so it can write
--    the forge-proof XP tables; capability gate via `user_can_create_channels`.
--    It enforces normalized name/slug uniqueness (quality over quantity) and
--    awards +100 XP on success.
-- =============================================================================

-- ─── 1. Channel ownership columns ────────────────────────────────────────────
alter table public.channels
  add column if not exists owner_kind text not null default 'platform'
    constraint channels_owner_kind_check
      check (owner_kind in ('platform', 'user')),
  add column if not exists created_by uuid references public.profiles (id)
    on delete set null;

comment on column public.channels.owner_kind is
  'platform (seeded / curator) | user (member-created). Extensible: an organization source can be added later without a rewrite.';
comment on column public.channels.created_by is
  'Author for user-created channels (null for platform channels).';

create index if not exists channels_owner_kind_idx on public.channels (owner_kind);

-- ─── 2. Channel memberships (join + notify preference) ───────────────────────
create table if not exists public.channel_memberships (
  channel_id uuid not null references public.channels (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member'
    constraint channel_memberships_role_check
      check (role in ('owner', 'member')),
  notify boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (channel_id, user_id)
);

create index if not exists channel_memberships_user_idx
  on public.channel_memberships (user_id);
create index if not exists channel_memberships_channel_idx
  on public.channel_memberships (channel_id);

comment on table public.channel_memberships is
  'Who joined which channel. `notify` is the per-membership update-notification preference (delivery deferred; default on).';

-- ─── 3. Challenge ↔ channel links (a channel holds hacks AND challenges) ─────
create table if not exists public.challenge_channels (
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  channel_id uuid not null references public.channels (id) on delete cascade,
  primary key (challenge_id, channel_id)
);

create index if not exists challenge_channels_channel_idx
  on public.challenge_channels (channel_id);

-- ─── 4. Row Level Security ───────────────────────────────────────────────────
alter table public.channel_memberships enable row level security;
alter table public.challenge_channels enable row level security;

-- channel_memberships: readable by any authenticated user (needed for member
-- counts + "who is in this channel" without leaking profile rows); each user
-- manages only their own membership (join / leave / notify toggle).
drop policy if exists "channel_memberships_select" on public.channel_memberships;
create policy "channel_memberships_select"
  on public.channel_memberships for select to authenticated using (true);

drop policy if exists "channel_memberships_insert_own" on public.channel_memberships;
create policy "channel_memberships_insert_own"
  on public.channel_memberships for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "channel_memberships_update_own" on public.channel_memberships;
create policy "channel_memberships_update_own"
  on public.channel_memberships for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "channel_memberships_delete_own" on public.channel_memberships;
create policy "channel_memberships_delete_own"
  on public.channel_memberships for delete to authenticated
  using (user_id = (select auth.uid()));

-- challenge_channels: read for any authenticated (challenges are peer-visible);
-- write by the challenge author or curator/admin.
drop policy if exists "challenge_channels_select" on public.challenge_channels;
create policy "challenge_channels_select"
  on public.challenge_channels for select to authenticated using (true);

drop policy if exists "challenge_channels_write" on public.challenge_channels;
create policy "challenge_channels_write"
  on public.challenge_channels for all to authenticated
  using (
    exists (
      select 1 from public.challenges ch
      where ch.id = challenge_channels.challenge_id
        and (
          ch.user_id = (select auth.uid())
          or exists (select 1 from public.profiles p
            where p.id = (select auth.uid()) and p.role in ('curator', 'admin'))
        )
    )
  )
  with check (
    exists (
      select 1 from public.challenges ch
      where ch.id = challenge_channels.challenge_id
        and (
          ch.user_id = (select auth.uid())
          or exists (select 1 from public.profiles p
            where p.id = (select auth.uid()) and p.role in ('curator', 'admin'))
        )
    )
  );

-- ─── 5. Capability helper: can the user create channels? ─────────────────────
-- Mirrors user_can_create_hacks: staff roles bypass; everyone else needs a
-- reached level row with can_create_channels (Specialist+, L3).
create or replace function public.user_can_create_channels(p_user uuid)
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
      where l.can_create_channels
        and l.min_xp <= public.user_total_xp(p_user)
    );
$$;

grant execute on function public.user_can_create_channels(uuid) to authenticated;

-- ─── 6. create_channel: gated create + dedup guard + 100 XP ──────────────────
-- Returns the new channel slug (for redirect). On a near-duplicate it raises
-- 'duplicate_channel:<existing_slug>' so the caller can offer "join instead".
create or replace function public.create_channel(
  p_name text,
  p_description text default null,
  p_slug text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_name text := nullif(trim(coalesce(p_name, '')), '');
  v_slug text;
  v_norm text;
  v_existing text;
  v_id uuid;
  v_award constant int := 100;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if not public.user_can_create_channels(v_uid) then
    raise exception 'not_allowed';
  end if;

  if v_name is null or length(v_name) < 3 then
    raise exception 'name_required';
  end if;

  -- Slugify: prefer an explicit slug, else derive from the name.
  v_slug := lower(coalesce(nullif(trim(coalesce(p_slug, '')), ''), v_name));
  v_slug := regexp_replace(v_slug, '[^a-z0-9]+', '-', 'g');
  v_slug := regexp_replace(v_slug, '(^-+|-+$)', '', 'g');
  if v_slug = '' then
    raise exception 'name_required';
  end if;

  -- Normalized name (lower + collapsed whitespace) for the duplicate guard.
  v_norm := lower(regexp_replace(v_name, '\s+', ' ', 'g'));

  select c.slug into v_existing
  from public.channels c
  where c.slug = v_slug
     or lower(regexp_replace(c.name, '\s+', ' ', 'g')) = v_norm
  limit 1;

  if v_existing is not null then
    raise exception 'duplicate_channel:%', v_existing;
  end if;

  insert into public.channels (slug, name, description, owner_kind, created_by, is_active)
  values (
    v_slug, v_name,
    nullif(trim(coalesce(p_description, '')), ''),
    'user', v_uid, true
  )
  returning id into v_id;

  -- The creator is the owner and is auto-joined (with notifications on).
  insert into public.channel_memberships (channel_id, user_id, role, notify)
  values (v_id, v_uid, 'owner', true)
  on conflict (channel_id, user_id) do nothing;

  -- Award XP: denormalized total + append-only ledger row.
  insert into public.user_xp (user_id, xp, updated_at)
  values (v_uid, v_award, now())
  on conflict (user_id) do update
    set xp = public.user_xp.xp + v_award, updated_at = now();

  insert into public.points_ledger (user_id, delta, reason, source_kind, source_id)
  values (v_uid, v_award, 'channel_created', 'channel', v_id);

  return v_slug;
end;
$$;

grant execute on function public.create_channel(text, text, text) to authenticated;

comment on function public.create_channel is
  'Capability-gated channel create: enforces normalized name/slug uniqueness (raises duplicate_channel:<slug> on overlap), inserts a user-owned channel, auto-joins the creator as owner, and awards 100 XP. SECURITY DEFINER for the forge-proof XP tables.';

-- ─── 7. channels_overview: rows + counts + caller membership state ───────────
-- One call powers the browse page AND the sidebar memberships list. SECURITY
-- DEFINER so public counts (published hacks, total members) are accurate
-- regardless of per-row RLS; only the caller's own membership flags are exposed.
-- Pass p_slug to fetch a single channel (detail page).
create or replace function public.channels_overview(p_slug text default null)
returns table (
  id uuid,
  slug text,
  name text,
  description text,
  owner_kind text,
  created_by uuid,
  member_count bigint,
  hack_count bigint,
  challenge_count bigint,
  is_member boolean,
  notify boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.slug,
    c.name,
    c.description,
    c.owner_kind,
    c.created_by,
    (select count(*) from public.channel_memberships m where m.channel_id = c.id)
      as member_count,
    (select count(*)
       from public.hack_channels hc
       join public.hacks h on h.id = hc.hack_id
      where hc.channel_id = c.id and h.status = 'published') as hack_count,
    (select count(*) from public.challenge_channels cc where cc.channel_id = c.id)
      as challenge_count,
    exists (
      select 1 from public.channel_memberships m2
      where m2.channel_id = c.id and m2.user_id = (select auth.uid())
    ) as is_member,
    coalesce(
      (select m3.notify from public.channel_memberships m3
        where m3.channel_id = c.id and m3.user_id = (select auth.uid())),
      false
    ) as notify
  from public.channels c
  where c.is_active
    and (p_slug is null or c.slug = p_slug)
  order by c.name;
$$;

grant execute on function public.channels_overview(text) to authenticated;

comment on function public.channels_overview is
  'Active channels with member/hack/challenge counts plus the calling user''s membership + notify flags. Pass p_slug for a single channel (detail). SECURITY DEFINER for accurate public counts.';

-- ─── 8. Platform channels by job function (sector-aligned slugs) ─────────────
-- Slugs intentionally equal profiles.sector values so onboarding can auto-join
-- a user to their sector channel by slug. ON CONFLICT keeps existing rows.
insert into public.channels (slug, name, description, owner_kind) values
  ('marketing',   'Marketing',        'AI-hacks voor marketeers: campagnes, copy en analyse.', 'platform'),
  ('content-creation', 'Content Creatie', 'Tekst, beeld en video sneller maken met AI.',        'platform'),
  ('design',      'Design',           'Sneller en slimmer ontwerpen met AI.',                  'platform'),
  ('product',     'Product',          'Discovery, specs en roadmaps versnellen met AI.',        'platform'),
  ('sales',       'Sales',            'Leads, outreach en deals versnellen met AI.',            'platform'),
  ('finance',     'Finance',          'Rapportages, analyses en forecasting met AI.',           'platform'),
  ('hr',          'HR',               'Werving, onboarding en people-ops met AI.',              'platform')
on conflict (slug) do nothing;
