-- =============================================================================
-- Slimmerbezig — Ask chat sessions (Track B3, ADR 2026-05-27)
-- Run AFTER ai_chat_schema.sql.
-- Safe additive: relaxes the chat_sessions_kind_check to allow 'ask'.
-- =============================================================================
--
-- Extends ChatKind with 'ask' — the rolling, never-closing session backing the
-- global Ask overlay. The existing unique partial index
-- (chat_sessions_one_open_per_user_kind_idx, ON (user_id, kind) WHERE status = 'open')
-- already enforces "one open ask session per user" without further changes.

alter table public.chat_sessions
  drop constraint if exists chat_sessions_kind_check;

alter table public.chat_sessions
  add constraint chat_sessions_kind_check
    check (kind in ('onboarding', 'checkin', 'ask'));

comment on column public.chat_sessions.kind is
  'onboarding | checkin | ask. ask sessions are intentionally never closed — one rolling row per user (see ADR 2026-05-27 — Continuous Ask/Search bar).';
