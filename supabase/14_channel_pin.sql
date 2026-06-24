-- =============================================================================
-- Slimmerbezig — Pin a hack to the top of a channel (Slack-style)
--
-- Run AFTER supabase/13_channel_edit.sql.
-- Additive only. One pinned hack per channel (nullable).
-- =============================================================================

alter table public.channels
  add column if not exists pinned_hack_id uuid references public.hacks (id)
    on delete set null;

comment on column public.channels.pinned_hack_id is
  'Optional hack pinned to the top of the channel feed. Cleared when the hack is deleted.';

create index if not exists channels_pinned_hack_idx
  on public.channels (pinned_hack_id)
  where pinned_hack_id is not null;

-- Channel admin: owner on user channels; curator/admin on platform channels.
create or replace function public.user_can_admin_channel(p_user uuid, p_channel_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.channels c
      where c.id = p_channel_id
        and c.owner_kind = 'user'
        and exists (
          select 1 from public.channel_memberships m
          where m.channel_id = c.id
            and m.user_id = p_user
            and m.role = 'owner'
        )
    )
    or exists (
      select 1 from public.channels c
      where c.id = p_channel_id
        and c.owner_kind = 'platform'
        and exists (
          select 1 from public.profiles p
          where p.id = p_user and p.role in ('curator', 'admin')
        )
    );
$$;

grant execute on function public.user_can_admin_channel(uuid, uuid) to authenticated;

create or replace function public.set_channel_pinned_hack(
  p_slug text,
  p_hack_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select c.id into v_id
  from public.channels c
  where c.slug = p_slug and c.is_active
  limit 1;

  if v_id is null then
    raise exception 'not_found';
  end if;

  if not public.user_can_admin_channel(v_uid, v_id) then
    raise exception 'not_allowed';
  end if;

  if p_hack_id is not null then
    if not exists (
      select 1
      from public.hack_channels hc
      join public.hacks h on h.id = hc.hack_id
      where hc.channel_id = v_id
        and hc.hack_id = p_hack_id
        and h.status = 'published'
    ) then
      raise exception 'hack_not_in_channel';
    end if;
  end if;

  update public.channels
  set pinned_hack_id = p_hack_id
  where id = v_id;
end;
$$;

grant execute on function public.set_channel_pinned_hack(text, uuid) to authenticated;

comment on function public.set_channel_pinned_hack is
  'Pin or unpin a published hack on a channel (pass null to unpin). Channel admin only: owner on user channels, curator/admin on platform channels.';

-- Extend channels_overview with pinned_hack_id (return type changed — drop first).
drop function if exists public.channels_overview(text);

create or replace function public.channels_overview(p_slug text default null)
returns table (
  id uuid,
  slug text,
  name text,
  description text,
  owner_kind text,
  created_by uuid,
  pinned_hack_id uuid,
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
    c.pinned_hack_id,
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
  'Active channels with member/hack/challenge counts, pinned_hack_id, plus the calling user''s membership + notify flags. Pass p_slug for a single channel (detail). SECURITY DEFINER for accurate public counts.';
