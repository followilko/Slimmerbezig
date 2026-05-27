-- =============================================================================
-- Slimmerbezig — find_hacks v2 (Track B7, ADR 2026-05-28)
-- Run AFTER schema.sql + learning_schema.sql + ai_chat_schema.sql + 03–08.
-- Safe: CREATE OR REPLACE only — same signature as 06_hack_search.sql.
-- =============================================================================
--
-- Extends public.find_hacks with a 3-tier retrieval chain:
--   1. Tag-overlap — query tokens matched against tags.slug (tool/sector/capability/topic)
--   2. Strict FTS — websearch_to_tsquery (AND semantics, same as v1)
--   3. Broadened OR fallback — only when tiers 1+2 are empty; stop-word strip + to_tsquery OR
--
-- Recent-published fallback (v1 parity):
--   - null / empty query (search bar cleared)
--   - non-empty query where every token is a stop-word (e.g. "hacks", "help please")
--
-- Non-empty queries with substantive tokens but zero matches return an empty set so the
-- Ask coach can auto-retry and suggest_challenge (e.g. "how do I bake bread").
--
-- Stop-word list is inline below. If it grows past ~30 entries, promote to
-- public.search_stopwords(slug text primary key) in a future migration.
-- =============================================================================

create or replace function public.find_hacks(
  p_query text default null,
  p_limit int default 10
)
returns setof public.hacks
language sql
stable
set search_path = public
as $$
  with q as (
    select nullif(trim(coalesce(p_query, '')), '') as raw_query
  ),
  -- Inline stop-word list — promote to a table if this grows past ~30 entries.
  stopwords(word) as (
    values
      ('tips'), ('tricks'), ('hacks'), ('ideas'), ('help'),
      ('how'), ('hoe'), ('voor'), ('over'), ('nodig'),
      ('heb'), ('ik'), ('een'), ('the'), ('a'),
      ('an'), ('for'), ('is'), ('there'), ('any'),
      ('to'), ('do'), ('have'), ('please'), ('kan'),
      ('jij'), ('jou'), ('mijn'), ('my')
  ),
  tokens as (
    select distinct tok as token
    from q,
      lateral regexp_split_to_table(lower(q.raw_query), '[^a-z0-9_]+') as tok
    where q.raw_query is not null
      and tok <> ''
      and length(tok) >= 2
  ),
  matched_tags as (
    select t.id, t.slug
    from tokens tok
    join public.tags t on t.slug = tok.token
    where t.kind in ('tool', 'sector', 'capability', 'topic')
  ),
  tier1 as (
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
      h.search_tsv,
      count(distinct mt.slug)::float8 as tag_overlap_count,
      0::float8 as ts_rank_strict,
      0::float8 as ts_rank_broad
    from public.hacks h
    join public.hack_tags ht on ht.hack_id = h.id
    join matched_tags mt on mt.id = ht.tag_id
    where h.status = 'published'
    group by
      h.id, h.author_id, h.source, h.title, h.summary, h.body_md,
      h.status, h.created_at, h.updated_at, h.search_tsv
  ),
  parsed as (
    select
      q.raw_query,
      case
        when q.raw_query is null then null
        else websearch_to_tsquery('simple', q.raw_query)
      end as ts_q
    from q
  ),
  tier2 as (
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
      h.search_tsv,
      0::float8 as tag_overlap_count,
      ts_rank_cd(h.search_tsv, parsed.ts_q)::float8 as ts_rank_strict,
      0::float8 as ts_rank_broad
    from public.hacks h
    cross join parsed
    where h.status = 'published'
      and parsed.ts_q is not null
      and h.search_tsv @@ parsed.ts_q
  ),
  tier12_ids as (
    select id from tier1
    union
    select id from tier2
  ),
  broad_tokens as (
    select
      regexp_replace(tok.token, '[^a-z0-9_]', '', 'g') as sanitized
    from tokens tok
    where tok.token not in (select word from stopwords)
      and length(regexp_replace(tok.token, '[^a-z0-9_]', '', 'g')) >= 2
  ),
  broad_tsquery as (
    select
      case
        when (select count(*) from broad_tokens) = 0 then null::tsquery
        else to_tsquery(
          'simple',
          (select string_agg(sanitized, ' | ') from broad_tokens)
        )
      end as ts_q
  ),
  tier3 as (
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
      h.search_tsv,
      0::float8 as tag_overlap_count,
      0::float8 as ts_rank_strict,
      ts_rank_cd(h.search_tsv, bt.ts_q)::float8 as ts_rank_broad
    from public.hacks h
    cross join broad_tsquery bt
    where h.status = 'published'
      and bt.ts_q is not null
      and not exists (select 1 from tier12_ids)
      and h.search_tsv @@ bt.ts_q
  ),
  recent_fallback as (
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
      h.search_tsv,
      0::float8 as tag_overlap_count,
      0::float8 as ts_rank_strict,
      0::float8 as ts_rank_broad
    from public.hacks h
    cross join q
    where h.status = 'published'
      and (
        q.raw_query is null
        or (
          not exists (select 1 from tier12_ids)
          and not exists (select 1 from tier3)
          and not exists (select 1 from broad_tokens)
        )
      )
  ),
  combined as (
    select * from tier1
    union all
    select * from tier2
    union all
    select * from tier3
    union all
    select * from recent_fallback
  ),
  scored as (
    select
      c.id,
      c.author_id,
      c.source,
      c.title,
      c.summary,
      c.body_md,
      c.status,
      c.created_at,
      c.updated_at,
      c.search_tsv,
      (
        0.8 * c.tag_overlap_count
        + coalesce(c.ts_rank_strict, 0)
        + 0.3 * coalesce(c.ts_rank_broad, 0)
      ) as score
    from combined c
  ),
  ranked as (
    select distinct on (s.id)
      s.id,
      s.author_id,
      s.source,
      s.title,
      s.summary,
      s.body_md,
      s.status,
      s.created_at,
      s.updated_at,
      s.search_tsv,
      s.score
    from scored s
    order by s.id, s.score desc
  )
  select
    r.id,
    r.author_id,
    r.source,
    r.title,
    r.summary,
    r.body_md,
    r.status,
    r.created_at,
    r.updated_at,
    r.search_tsv
  from ranked r
  order by r.score desc, r.created_at desc
  limit greatest(coalesce(p_limit, 10), 1);
$$;

comment on function public.find_hacks(text, int) is
  'Published hack search v2: tag-overlap boost + strict FTS + gated OR fallback. Empty query or all-stop-word query returns recent published hacks. SECURITY INVOKER — RLS on hacks scopes visibility. See ADR 2026-05-28 — find_hacks v2.';

grant execute on function public.find_hacks(text, int) to authenticated;
