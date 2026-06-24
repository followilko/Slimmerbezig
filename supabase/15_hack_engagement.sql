-- =============================================================================
-- Slimmerbezig — Hack engagement: public stats, likes/saves RPCs, coins ledger.
--
-- Run AFTER supabase/14_channel_pin.sql.
-- Additive only. Safe to re-run (IF NOT EXISTS + DROP POLICY/FUNCTION guards).
--
-- Design notes:
--  * `hack_stats` holds denormalized like/save/comment counts (RPC-only writes)
--    because `hack_interactions` is select-own — clients cannot aggregate.
--  * `helpful` interaction kind is repurposed as the public Like (heart).
--  * `user_coins` + `coin_ledger` mirror the forge-proof XP pattern; coins are
--    redeemable value separate from XP. Awarded invisibly on engagement.
-- =============================================================================

-- ─── 1. Denormalized public counters ─────────────────────────────────────────
create table if not exists public.hack_stats (
  hack_id uuid primary key references public.hacks (id) on delete cascade,
  like_count integer not null default 0,
  save_count integer not null default 0,
  comment_count integer not null default 0,
  updated_at timestamptz not null default now()
);

comment on table public.hack_stats is
  'Public engagement counters per hack. Written only by SECURITY DEFINER RPCs.';

-- ─── 2. Coins (forge-proof balance + append-only ledger) ─────────────────────
create table if not exists public.user_coins (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  coins integer not null default 0,
  updated_at timestamptz not null default now()
);

comment on table public.user_coins is
  'Denormalized redeemable coin balance. Written only by SECURITY DEFINER RPCs.';

create table if not exists public.coin_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta integer not null,
  reason text not null
    constraint coin_ledger_reason_check
      check (reason in ('like_received', 'comment_received', 'manual_adjust')),
  source_kind text,
  source_id uuid,
  actor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint coin_delta_nonzero check (delta <> 0)
);

create index if not exists coin_ledger_user_idx
  on public.coin_ledger (user_id, created_at desc);

comment on table public.coin_ledger is
  'Append-only coin audit trail. Written only by SECURITY DEFINER RPCs.';

-- ─── 3. Row Level Security ───────────────────────────────────────────────────
alter table public.hack_stats enable row level security;
alter table public.user_coins enable row level security;
alter table public.coin_ledger enable row level security;

drop policy if exists "hack_stats_select_authenticated" on public.hack_stats;
create policy "hack_stats_select_authenticated"
  on public.hack_stats for select to authenticated using (true);

drop policy if exists "user_coins_select_own" on public.user_coins;
create policy "user_coins_select_own"
  on public.user_coins for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('curator', 'admin')
    )
  );

drop policy if exists "coin_ledger_select_own" on public.coin_ledger;
create policy "coin_ledger_select_own"
  on public.coin_ledger for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('curator', 'admin')
    )
  );

-- ─── 4. Helpers ──────────────────────────────────────────────────────────────
create or replace function public.user_total_coins(p_user uuid)
returns integer
language sql
stable
set search_path = public
as $$
  select coalesce((select coins from public.user_coins where user_id = p_user), 0);
$$;

grant execute on function public.user_total_coins(uuid) to authenticated;

-- Internal: award or deduct coins atomically (SECURITY DEFINER callers only).
create or replace function public._award_coins(
  p_user uuid,
  p_delta integer,
  p_reason text,
  p_source_kind text,
  p_source_id uuid,
  p_actor_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user is null or p_delta = 0 then
    return;
  end if;

  insert into public.user_coins (user_id, coins, updated_at)
  values (p_user, p_delta, now())
  on conflict (user_id) do update
    set coins = public.user_coins.coins + p_delta,
        updated_at = now();

  insert into public.coin_ledger (user_id, delta, reason, source_kind, source_id, actor_id)
  values (p_user, p_delta, p_reason, p_source_kind, p_source_id, p_actor_id);
end;
$$;

-- Ensure a hack_stats row exists (idempotent).
create or replace function public._ensure_hack_stats(p_hack_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.hack_stats (hack_id)
  values (p_hack_id)
  on conflict (hack_id) do nothing;
end;
$$;

-- ─── 5. toggle_hack_like ─────────────────────────────────────────────────────
-- Uses hack_interactions(kind='helpful') as the Like signal.
-- Returns true when liked after toggle, false when unliked.
create or replace function public.toggle_hack_like(p_hack_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_author_id uuid;
  v_exists boolean;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select h.author_id into v_author_id
  from public.hacks h
  where h.id = p_hack_id and h.status = 'published';

  if not found then
    raise exception 'hack_not_found';
  end if;

  perform public._ensure_hack_stats(p_hack_id);

  select exists (
    select 1 from public.hack_interactions hi
    where hi.user_id = v_uid
      and hi.hack_id = p_hack_id
      and hi.kind = 'helpful'
  ) into v_exists;

  if v_exists then
    delete from public.hack_interactions
    where user_id = v_uid and hack_id = p_hack_id and kind = 'helpful';

    update public.hack_stats
    set like_count = greatest(like_count - 1, 0), updated_at = now()
    where hack_id = p_hack_id;

    if v_author_id is not null and v_author_id <> v_uid then
      perform public._award_coins(
        v_author_id, -1, 'like_received', 'hack', p_hack_id, v_uid
      );
    end if;

    return false;
  else
    insert into public.hack_interactions (user_id, hack_id, kind)
    values (v_uid, p_hack_id, 'helpful');

    update public.hack_stats
    set like_count = like_count + 1, updated_at = now()
    where hack_id = p_hack_id;

    if v_author_id is not null and v_author_id <> v_uid then
      perform public._award_coins(
        v_author_id, 1, 'like_received', 'hack', p_hack_id, v_uid
      );
    end if;

    return true;
  end if;
end;
$$;

grant execute on function public.toggle_hack_like(uuid) to authenticated;

-- ─── 6. toggle_hack_save ─────────────────────────────────────────────────────
create or replace function public.toggle_hack_save(p_hack_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_exists boolean;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (
    select 1 from public.hacks h
    where h.id = p_hack_id and h.status = 'published'
  ) then
    raise exception 'hack_not_found';
  end if;

  perform public._ensure_hack_stats(p_hack_id);

  select exists (
    select 1 from public.hack_interactions hi
    where hi.user_id = v_uid
      and hi.hack_id = p_hack_id
      and hi.kind = 'saved'
  ) into v_exists;

  if v_exists then
    delete from public.hack_interactions
    where user_id = v_uid and hack_id = p_hack_id and kind = 'saved';

    update public.hack_stats
    set save_count = greatest(save_count - 1, 0), updated_at = now()
    where hack_id = p_hack_id;

    return false;
  else
    insert into public.hack_interactions (user_id, hack_id, kind)
    values (v_uid, p_hack_id, 'saved');

    update public.hack_stats
    set save_count = save_count + 1, updated_at = now()
    where hack_id = p_hack_id;

    return true;
  end if;
end;
$$;

grant execute on function public.toggle_hack_save(uuid) to authenticated;

-- ─── 7. Backfill hack_stats for existing hacks ─────────────────────────────────
insert into public.hack_stats (hack_id, like_count, save_count, comment_count)
select
  h.id,
  coalesce((
    select count(*)::int from public.hack_interactions hi
    where hi.hack_id = h.id and hi.kind = 'helpful'
  ), 0),
  coalesce((
    select count(*)::int from public.hack_interactions hi
    where hi.hack_id = h.id and hi.kind = 'saved'
  ), 0),
  0
from public.hacks h
on conflict (hack_id) do update
  set like_count = excluded.like_count,
      save_count = excluded.save_count,
      updated_at = now();

comment on function public.toggle_hack_like is
  'Toggle Like on a published hack (uses hack_interactions kind=helpful). Updates hack_stats and awards/deducts 1 coin to the hack author (skip self).';

comment on function public.toggle_hack_save is
  'Toggle Save on a published hack. Updates hack_stats.save_count. No coin award.';
