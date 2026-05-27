-- =============================================================================
-- Slimmerbezig — self-serve account delete (testing reset)
-- Run AFTER supabase/03_onboarding_extras.sql (or any later baseline).
-- Safe additive DDL.
-- =============================================================================
--
-- Deletes the authenticated row in auth.users; profiles and all tables that
-- FK to profiles ON DELETE CASCADE follow. hacks.author_id stays SET NULL via
-- its FK (see learning_schema.sql).

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  delete from auth.users
  where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

comment on function public.delete_my_account() is
  'Self-serve account delete. Removes auth.users row; cascades to profiles and all user-owned rows. hacks.author_id is SET NULL by FK. Used by Dashboard "Delete my profile" testing affordance.';
