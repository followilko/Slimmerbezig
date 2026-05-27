-- =============================================================================
-- Slimmerbezig — hack full-text search (Track B1, ADR 2026-05-27)
-- Run AFTER schema.sql + learning_schema.sql + ai_chat_schema.sql + 03/04/05.
-- Safe additive DDL.
-- =============================================================================
--
-- Adds a STORED tsvector column on public.hacks driven by title (weight A),
-- summary (B), and body_md (C). Indexed with GIN. The 'simple' text-search
-- config is used because the corpus mixes Dutch/English/etc. — 'english'
-- stemming would mangle non-English content. We can branch to per-locale
-- columns later if needed.
--
-- find_hacks(p_query text, p_limit int) returns published hacks ordered by
-- ts_rank_cd against the websearch query parser. Empty / null queries return
-- recent hacks unfiltered (handy fallback for an empty search bar).
--
-- SECURITY INVOKER (language sql default) — RLS on public.hacks restricts
-- visibility to `status = 'published'` for the authenticated reader. The
-- function also enforces published-only as belt-and-braces.
-- =============================================================================

alter table public.hacks
  add column if not exists search_tsv tsvector
    generated always as (
      setweight(to_tsvector('simple', coalesce(title, '')), 'A')
      || setweight(to_tsvector('simple', coalesce(summary, '')), 'B')
      || setweight(to_tsvector('simple', coalesce(body_md, '')), 'C')
    ) stored;

comment on column public.hacks.search_tsv is
  'Weighted tsvector (title=A, summary=B, body_md=C) auto-generated. Used by public.find_hacks for FTS. Config: simple (locale-agnostic). See ADR 2026-05-27 — Postgres FTS for hack search.';

create index if not exists hacks_search_tsv_idx
  on public.hacks using gin (search_tsv);

-- ─── find_hacks RPC ──────────────────────────────────────────────────────────

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
    select
      nullif(trim(coalesce(p_query, '')), '') as raw_query
  ),
  parsed as (
    select
      q.raw_query,
      case
        when q.raw_query is null then null
        else websearch_to_tsquery('simple', q.raw_query)
      end as ts_q
    from q
  )
  select h.*
  from public.hacks h, parsed
  where h.status = 'published'
    and (
      parsed.ts_q is null
      or h.search_tsv @@ parsed.ts_q
    )
  order by
    case
      when parsed.ts_q is null then 0
      else ts_rank_cd(h.search_tsv, parsed.ts_q)
    end desc,
    h.created_at desc
  limit greatest(coalesce(p_limit, 10), 1);
$$;

comment on function public.find_hacks(text, int) is
  'Postgres FTS over published hacks. Uses websearch_to_tsquery (handles "and"/"or"/quoted phrases naturally). Null / empty query returns most recent published hacks. SECURITY INVOKER — RLS on hacks scopes visibility.';

grant execute on function public.find_hacks(text, int) to authenticated;
