-- Exécuter dans Supabase : SQL Editor > New query > Run
-- Corrige PGRST205 si les tables n’existent pas encore.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key,
  email text not null,
  name text not null,
  language text not null default 'en',
  theme text not null default 'system',
  daily_objective integer not null default 5,
  objective_per_pillar jsonb not null default '{"soulset":1,"healthset":1,"mindset":1,"skillset":1,"heartset":1}',
  custom_feelings jsonb not null default '[]',
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.deeds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  pillar text not null,
  action_name text not null,
  duration integer,
  thought text,
  feeling text not null default 'neutral',
  date text not null,
  time text not null,
  week integer not null,
  month text not null,
  year integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.weekly_resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_id text not null,
  narrative text not null,
  audio_base64 text,
  created_at timestamptz not null default now(),
  unique (user_id, week_id)
);

alter table public.profiles enable row level security;
alter table public.deeds enable row level security;
alter table public.weekly_resumes enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

drop policy if exists "deeds_select_own" on public.deeds;
drop policy if exists "deeds_insert_own" on public.deeds;
drop policy if exists "deeds_update_own" on public.deeds;
drop policy if exists "deeds_delete_own" on public.deeds;

drop policy if exists "resumes_select_own" on public.weekly_resumes;
drop policy if exists "resumes_insert_own" on public.weekly_resumes;
drop policy if exists "resumes_update_own" on public.weekly_resumes;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create policy "deeds_select_own" on public.deeds for select using (auth.uid() = user_id);
create policy "deeds_insert_own" on public.deeds for insert with check (auth.uid() = user_id);
create policy "deeds_update_own" on public.deeds for update using (auth.uid() = user_id);
create policy "deeds_delete_own" on public.deeds for delete using (auth.uid() = user_id);

create policy "resumes_select_own" on public.weekly_resumes for select using (auth.uid() = user_id);
create policy "resumes_insert_own" on public.weekly_resumes for insert with check (auth.uid() = user_id);
create policy "resumes_update_own" on public.weekly_resumes for update using (auth.uid() = user_id);
