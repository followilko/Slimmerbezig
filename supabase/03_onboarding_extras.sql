-- =============================================================================
-- Slimmerbezig — onboarding extras (Track A, ADR 2026-05-27)
-- Run AFTER supabase/schema.sql + learning_schema.sql + ai_chat_schema.sql.
-- Safe additive DDL.
-- =============================================================================

-- LinkedIn URL captured during the 3-question onboarding (record_linkedin tool).
-- Stored as the normalized canonical form: https://www.linkedin.com/in/<vanity>/
-- Phase 2 will pair this with a Proxycurl fetch behind PROXYCURL_API_KEY.
alter table public.profiles
  add column if not exists linkedin_url text;

comment on column public.profiles.linkedin_url is
  'Normalized LinkedIn profile URL (https://www.linkedin.com/in/<vanity>/) captured by the AI onboarding coach via record_linkedin tool. Optional. Server-validated by lib/ai/linkedin.ts.';

-- (No new RLS needed — profiles_select_own / profiles_update_own already cover this column.)
