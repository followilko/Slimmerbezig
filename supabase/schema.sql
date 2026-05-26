-- Run this in Supabase: SQL Editor → New query → Paste → Run

-- 1. Profiles table (FK to auth.users — one row per authenticated user)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  given_name   text,
  family_name  text,
  email        text,
  avatar_url   text,
  locale       text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 2. Row Level Security: users can only read/update their own row
alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 3. Auto-create a profile when a new Auth user is created (OAuth sign-in)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, given_name, family_name, email, avatar_url, locale)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'given_name',
    new.raw_user_meta_data ->> 'family_name',
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'picture',
      new.raw_user_meta_data ->> 'avatar_url'
    ),
    new.raw_user_meta_data ->> 'locale'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Keep updated_at fresh on updates
create or replace function public.profiles_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.profiles_set_updated_at();
