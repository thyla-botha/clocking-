-- Run this in the Supabase SQL editor. Safe to re-run.
-- This is the canonical schema. Reflects all applied migrations.

-- ============================================================
-- Tables
-- ============================================================

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  project_id uuid references projects on delete set null,
  start_at timestamptz not null default now(),
  end_at timestamptz,
  start_lat double precision not null,
  start_lng double precision not null,
  start_accuracy double precision,
  end_lat double precision,
  end_lng double precision,
  end_accuracy double precision,
  notes text,
  auto_closed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists time_entries_user_start_idx
  on time_entries (user_id, start_at desc);

create unique index if not exists time_entries_one_open_per_user
  on time_entries (user_id) where end_at is null;

create index if not exists time_entries_project_id_idx
  on time_entries (project_id);

-- ============================================================
-- Private schema for internal helpers (not exposed via PostgREST)
-- ============================================================

create schema if not exists private;
grant usage on schema private to authenticated, supabase_auth_admin;

-- is_admin: SECURITY DEFINER so RLS policies can read profiles without recursion.
-- Wrapped (select auth.uid()) so Postgres caches the value per-query, not per-row.
create or replace function private.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = (select auth.uid())), false);
$$;
revoke execute on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

-- handle_new_user: signup trigger. Only the auth-admin role invokes it.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function private.handle_new_user() from public;
grant execute on function private.handle_new_user() to supabase_auth_admin;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure private.handle_new_user();

-- Backfill profiles for users that existed before the trigger
insert into profiles (id, email)
select id, email from auth.users
where id not in (select id from profiles);

-- ============================================================
-- RLS
-- All policies use (select auth.uid()) / (select auth.role()) so Postgres
-- evaluates the auth function once per query, not once per row.
-- Per-action policies (no FOR ALL) so we never end up with multiple
-- permissive policies on the same role + action.
-- ============================================================

alter table projects enable row level security;
alter table profiles enable row level security;
alter table time_entries enable row level security;

-- projects: any authenticated user can read & insert
drop policy if exists "read projects" on projects;
create policy "read projects" on projects
  for select using ((select auth.role()) = 'authenticated');

drop policy if exists "insert projects" on projects;
create policy "insert projects" on projects
  for insert with check ((select auth.role()) = 'authenticated');

-- profiles: users see their own row, admins see all; users update their own
drop policy if exists "read profiles" on profiles;
create policy "read profiles" on profiles
  for select using ((select auth.uid()) = id or private.is_admin());

drop policy if exists "update own profile" on profiles;
create policy "update own profile" on profiles
  for update
    using ((select auth.uid()) = id)
    with check ((select auth.uid()) = id);

-- time_entries: users CRUD their own; admins read & update all
drop policy if exists "read entries" on time_entries;
create policy "read entries" on time_entries
  for select using ((select auth.uid()) = user_id or private.is_admin());

drop policy if exists "insert own entries" on time_entries;
create policy "insert own entries" on time_entries
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "update entries" on time_entries;
create policy "update entries" on time_entries
  for update
    using ((select auth.uid()) = user_id or private.is_admin())
    with check ((select auth.uid()) = user_id or private.is_admin());

drop policy if exists "delete own entries" on time_entries;
create policy "delete own entries" on time_entries
  for delete using ((select auth.uid()) = user_id);

-- ============================================================
-- Seed
-- ============================================================

insert into projects (name)
  select 'Default Project'
  where not exists (select 1 from projects);

-- ============================================================
-- Promoting yourself to admin
-- ============================================================
-- After signing in once, run:
--   update profiles set is_admin = true where email = 'you@example.com';
