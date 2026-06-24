-- =============================================================================
-- Slimmerbezig — Hack comments: threaded discussion + improvement tips.
--
-- Run AFTER supabase/15_hack_engagement.sql.
-- Additive only. Safe to re-run.
-- =============================================================================

-- ─── 1. Comments ─────────────────────────────────────────────────────────────
create table if not exists public.hack_comments (
  id uuid primary key default gen_random_uuid(),
  hack_id uuid not null references public.hacks (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  parent_comment_id uuid references public.hack_comments (id) on delete cascade,
  body_md text not null default '',
  is_tip boolean not null default false,
  like_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hack_comments_hack_idx
  on public.hack_comments (hack_id, created_at desc);

create index if not exists hack_comments_parent_idx
  on public.hack_comments (parent_comment_id)
  where parent_comment_id is not null;

comment on table public.hack_comments is
  'Threaded comments on hacks. is_tip marks improvement suggestions (distinct UI).';

drop trigger if exists hack_comments_set_updated_at on public.hack_comments;
create trigger hack_comments_set_updated_at
  before update on public.hack_comments
  for each row execute function public.profiles_set_updated_at();

-- ─── 2. Comment likes ────────────────────────────────────────────────────────
create table if not exists public.comment_likes (
  comment_id uuid not null references public.hack_comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists comment_likes_user_idx
  on public.comment_likes (user_id);

-- ─── 3. Row Level Security ───────────────────────────────────────────────────
alter table public.hack_comments enable row level security;
alter table public.comment_likes enable row level security;

drop policy if exists "hack_comments_select" on public.hack_comments;
create policy "hack_comments_select"
  on public.hack_comments for select to authenticated
  using (
    exists (
      select 1 from public.hacks h
      where h.id = hack_comments.hack_id
        and (
          h.status = 'published'
          or h.author_id = (select auth.uid())
          or exists (
            select 1 from public.profiles p
            where p.id = (select auth.uid()) and p.role in ('curator', 'admin')
          )
        )
    )
  );

drop policy if exists "hack_comments_insert_own" on public.hack_comments;
create policy "hack_comments_insert_own"
  on public.hack_comments for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.hacks h
      where h.id = hack_comments.hack_id and h.status = 'published'
    )
  );

drop policy if exists "hack_comments_update_own" on public.hack_comments;
create policy "hack_comments_update_own"
  on public.hack_comments for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

drop policy if exists "hack_comments_delete_own" on public.hack_comments;
create policy "hack_comments_delete_own"
  on public.hack_comments for delete to authenticated
  using (
    author_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('curator', 'admin')
    )
  );

drop policy if exists "comment_likes_select" on public.comment_likes;
create policy "comment_likes_select"
  on public.comment_likes for select to authenticated using (true);

drop policy if exists "comment_likes_insert_own" on public.comment_likes;
create policy "comment_likes_insert_own"
  on public.comment_likes for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "comment_likes_delete_own" on public.comment_likes;
create policy "comment_likes_delete_own"
  on public.comment_likes for delete to authenticated
  using (user_id = (select auth.uid()));

-- ─── 4. add_hack_comment ─────────────────────────────────────────────────────
create or replace function public.add_hack_comment(
  p_hack_id uuid,
  p_body_md text,
  p_is_tip boolean default false,
  p_parent_comment_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_author_id uuid;
  v_comment_id uuid;
  v_body text;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  v_body := nullif(trim(coalesce(p_body_md, '')), '');
  if v_body is null then
    raise exception 'body_required';
  end if;

  select h.author_id into v_author_id
  from public.hacks h
  where h.id = p_hack_id and h.status = 'published';

  if not found then
    raise exception 'hack_not_found';
  end if;

  if p_parent_comment_id is not null then
    if not exists (
      select 1 from public.hack_comments c
      where c.id = p_parent_comment_id and c.hack_id = p_hack_id
    ) then
      raise exception 'parent_not_found';
    end if;
  end if;

  insert into public.hack_comments (
    hack_id, author_id, parent_comment_id, body_md, is_tip
  )
  values (p_hack_id, v_uid, p_parent_comment_id, v_body, coalesce(p_is_tip, false))
  returning id into v_comment_id;

  perform public._ensure_hack_stats(p_hack_id);

  update public.hack_stats
  set comment_count = comment_count + 1, updated_at = now()
  where hack_id = p_hack_id;

  -- Award hack author 1 coin for a top-level comment (skip self).
  if p_parent_comment_id is null
     and v_author_id is not null
     and v_author_id <> v_uid then
    perform public._award_coins(
      v_author_id, 1, 'comment_received', 'hack_comment', v_comment_id, v_uid
    );
  end if;

  return v_comment_id;
end;
$$;

grant execute on function public.add_hack_comment(uuid, text, boolean, uuid) to authenticated;

-- ─── 5. delete_hack_comment ──────────────────────────────────────────────────
create or replace function public.delete_hack_comment(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_hack_id uuid;
  v_author_id uuid;
  v_parent_id uuid;
  v_comment_author uuid;
  v_hack_author uuid;
  v_reply_count int;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select c.hack_id, c.author_id, c.parent_comment_id, h.author_id
  into v_hack_id, v_comment_author, v_parent_id, v_hack_author
  from public.hack_comments c
  join public.hacks h on h.id = c.hack_id
  where c.id = p_comment_id;

  if not found then
    raise exception 'comment_not_found';
  end if;

  if v_comment_author <> v_uid
     and not exists (
       select 1 from public.profiles p
       where p.id = v_uid and p.role in ('curator', 'admin')
     ) then
    raise exception 'not_allowed';
  end if;

  select count(*)::int into v_reply_count
  from public.hack_comments
  where parent_comment_id = p_comment_id;

  delete from public.hack_comments where id = p_comment_id;

  perform public._ensure_hack_stats(v_hack_id);

  update public.hack_stats
  set comment_count = greatest(comment_count - 1 - v_reply_count, 0),
      updated_at = now()
  where hack_id = v_hack_id;

  -- Deduct hack author coin if top-level comment from someone else.
  if v_parent_id is null
     and v_hack_author is not null
     and v_comment_author <> v_hack_author then
    perform public._award_coins(
      v_hack_author, -1, 'comment_received', 'hack_comment', p_comment_id, v_comment_author
    );
  end if;
end;
$$;

grant execute on function public.delete_hack_comment(uuid) to authenticated;

-- ─── 6. toggle_comment_like ──────────────────────────────────────────────────
create or replace function public.toggle_comment_like(p_comment_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_comment_author uuid;
  v_exists boolean;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select c.author_id into v_comment_author
  from public.hack_comments c
  join public.hacks h on h.id = c.hack_id
  where c.id = p_comment_id and h.status = 'published';

  if not found then
    raise exception 'comment_not_found';
  end if;

  select exists (
    select 1 from public.comment_likes cl
    where cl.comment_id = p_comment_id and cl.user_id = v_uid
  ) into v_exists;

  if v_exists then
    delete from public.comment_likes
    where comment_id = p_comment_id and user_id = v_uid;

    update public.hack_comments
    set like_count = greatest(like_count - 1, 0)
    where id = p_comment_id;

    if v_comment_author <> v_uid then
      perform public._award_coins(
        v_comment_author, -1, 'like_received', 'comment', p_comment_id, v_uid
      );
    end if;

    return false;
  else
    insert into public.comment_likes (comment_id, user_id)
    values (p_comment_id, v_uid);

    update public.hack_comments
    set like_count = like_count + 1
    where id = p_comment_id;

    if v_comment_author <> v_uid then
      perform public._award_coins(
        v_comment_author, 1, 'like_received', 'comment', p_comment_id, v_uid
      );
    end if;

    return true;
  end if;
end;
$$;

grant execute on function public.toggle_comment_like(uuid) to authenticated;

comment on function public.add_hack_comment is
  'Add a comment or reply on a published hack. Updates hack_stats.comment_count; awards hack author 1 coin for top-level comments (skip self).';

comment on function public.delete_hack_comment is
  'Delete own comment (or curator/admin any). Cascades replies; adjusts counts and deducts coin if applicable.';

comment on function public.toggle_comment_like is
  'Toggle like on a comment. Updates like_count; awards/deducts 1 coin to comment author (skip self).';
