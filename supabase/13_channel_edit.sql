-- =============================================================================
-- Slimmerbezig — Channel owner edits (name + description)
--
-- Run AFTER supabase/12_channels.sql.
-- Additive only. Slug stays fixed so URLs remain stable.
-- =============================================================================

create or replace function public.update_channel(
  p_slug text,
  p_name text,
  p_description text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_owner_kind text;
  v_name text := nullif(trim(coalesce(p_name, '')), '');
  v_norm text;
  v_existing text;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select c.id, c.owner_kind into v_id, v_owner_kind
  from public.channels c
  where c.slug = p_slug and c.is_active
  limit 1;

  if v_id is null then
    raise exception 'not_found';
  end if;

  if v_owner_kind <> 'user' then
    raise exception 'not_allowed';
  end if;

  if not exists (
    select 1 from public.channel_memberships m
    where m.channel_id = v_id
      and m.user_id = v_uid
      and m.role = 'owner'
  ) then
    raise exception 'not_allowed';
  end if;

  if v_name is null or length(v_name) < 3 then
    raise exception 'name_required';
  end if;

  v_norm := lower(regexp_replace(v_name, '\s+', ' ', 'g'));

  select c.slug into v_existing
  from public.channels c
  where c.id <> v_id
    and lower(regexp_replace(c.name, '\s+', ' ', 'g')) = v_norm
  limit 1;

  if v_existing is not null then
    raise exception 'duplicate_channel:%', v_existing;
  end if;

  update public.channels
  set
    name = v_name,
    description = nullif(trim(coalesce(p_description, '')), '')
  where id = v_id;
end;
$$;

grant execute on function public.update_channel(text, text, text) to authenticated;

comment on function public.update_channel is
  'Owner-only edit for user-created channels: updates name and description (slug unchanged). Raises duplicate_channel:<slug> when the normalized name matches another channel.';
