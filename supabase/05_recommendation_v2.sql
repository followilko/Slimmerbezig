-- =============================================================================
-- Slimmerbezig — get_recommended_hacks v2 (Track C1, ADR 2026-05-27)
-- Run AFTER schema.sql + learning_schema.sql + ai_chat_schema.sql + 03/04 extras.
-- Safe additive: replaces the existing SQL function with the same signature.
-- =============================================================================
--
-- v2 layers implicit signals from public.hack_interactions on top of the v1
-- tag-overlap algebra:
--
--   score(hack) =
--       overlap_count                          -- v1 base: sector ∪ frustrations ∪ checkins ∪ interests
--     + 2 * helpful_tag_overlap_count          -- boost: shares tags with hacks the user marked helpful
--     - 0.5 * viewed_count                     -- decay: deprioritize already-seen hacks
--     - 1.0 * completed_count                  -- harder decay: things the user reports doing
--
--   hard exclude: any hack the user marked `not_helpful`
--   keep filter:  score > 0  (preserves v1 "must overlap to surface" behaviour
--                              while letting helpful_tag overlap stand on its own)
--
-- Runs as SECURITY INVOKER (language sql default) — RLS on hack_interactions
-- and the user-owned source tables already restricts visibility to auth.uid().
-- =============================================================================

create or replace function public.get_recommended_hacks(p_limit int default 20)
returns setof public.hacks
language sql
stable
set search_path = public
as $$
  with me as (select (select auth.uid()) as uid),
  overlap_tags as (
    select t.id
      from public.tags t, me
      where t.kind = 'sector'
        and t.slug = (
          select p.sector::text
            from public.profiles p
            where p.id = me.uid
        )
    union
    select ft.tag_id
      from public.user_frustration_tags ft
      join public.user_frustrations f on f.id = ft.frustration_id
      cross join me
      where f.user_id = me.uid
        and f.resolved_at is null
    union
    select ct.tag_id
      from public.weekly_checkin_tags ct
      join public.weekly_checkins c on c.id = ct.checkin_id
      cross join me
      where c.user_id = me.uid
    union
    select ui.tag_id
      from public.user_interests ui, me
      where ui.user_id = me.uid
  ),
  excluded_hacks as (
    select hi.hack_id
      from public.hack_interactions hi, me
      where hi.user_id = me.uid
        and hi.kind = 'not_helpful'
  ),
  helpful_tags as (
    select distinct ht.tag_id
      from public.hack_interactions hi
      join public.hack_tags ht on ht.hack_id = hi.hack_id
      cross join me
      where hi.user_id = me.uid
        and hi.kind = 'helpful'
  ),
  scored as (
    select
      h.id,
      h.author_id,
      h.source,
      h.title,
      h.summary,
      h.body_md,
      h.status,
      h.created_at,
      h.updated_at,
      (
        coalesce(
          (select count(*)::float
             from public.hack_tags ht
             where ht.hack_id = h.id
               and ht.tag_id in (select id from overlap_tags)),
          0
        )
        + 2.0 * coalesce(
            (select count(*)::float
               from public.hack_tags ht2
               where ht2.hack_id = h.id
                 and ht2.tag_id in (select tag_id from helpful_tags)),
            0
          )
        - 0.5 * coalesce(
            (select count(*)::float
               from public.hack_interactions hi
               where hi.user_id = (select uid from me)
                 and hi.hack_id = h.id
                 and hi.kind = 'viewed'),
            0
          )
        - 1.0 * coalesce(
            (select count(*)::float
               from public.hack_interactions hi
               where hi.user_id = (select uid from me)
                 and hi.hack_id = h.id
                 and hi.kind = 'completed'),
            0
          )
      ) as score
    from public.hacks h
    where h.status = 'published'
      and h.id not in (select hack_id from excluded_hacks)
  )
  select
    id, author_id, source, title, summary, body_md,
    status, created_at, updated_at
  from scored
  where score > 0
  order by score desc, created_at desc
  limit coalesce(p_limit, 20);
$$;

comment on function public.get_recommended_hacks(int) is
  'v2: tag-overlap base + helpful boost + viewed/completed decay; excludes not_helpful. Sector ∪ open frustrations ∪ weekly check-ins ∪ user_interests feed the overlap set. SECURITY INVOKER — RLS on hack_interactions / user-owned tables enforces per-user scoping.';

grant execute on function public.get_recommended_hacks(int) to authenticated;
